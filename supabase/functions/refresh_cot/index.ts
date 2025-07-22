// supabase/functions/refresh_cot/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const START_YEAR   = 2008;
const LOOKBACK     = 156;

type RawRow = {
  contract: string;
  report_date: string;
  prod_class: string;
  comm_long: number;
  comm_short: number;
  ls_long: number;
  ls_short: number;
  ss_long: number;
  ss_short: number;
  contract_id?: string;
};

type MetricRow = {
  contract_id: string;
  report_date: string;
  comm_net: number;
  ls_net: number;
  ss_net: number;
  comm_index: number;
  ls_index: number;
  ss_index: number;
  wow_comm_delta: number | null;
  wow_ls_delta: number | null;
  wow_ss_delta: number | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const url = new URL(req.url);

  try {
    if (url.pathname.endsWith("/refresh/run")) {
      const mode      = url.searchParams.get("mode") ?? "full"; // full | year
      const yearParam = url.searchParams.get("year");
      const start     = yearParam ? parseInt(yearParam) : START_YEAR;
      const thisYear  = new Date().getFullYear();

      let weeklyRows = 0, metricRows = 0;
      const errors: string[] = [];

      // Cache contracts
      const { data: existing } = await supabase.from("contracts").select("id,name");
      const idMap = new Map<string,string>(existing?.map((r:any)=>[r.name,r.id]) ?? []);

      const years = mode === "full" ? range(start, thisYear) : [start];

      for (const y of years) {
        try {
          const raw = await fetchYearTXT(y); // RawRow[]
          // Upsert contracts
          for (const name of new Set(raw.map(r => r.contract))) {
            if (!idMap.has(name)) {
              const { data: ex } = await supabase.from("contracts").select("id").eq("name", name).maybeSingle();
              if (ex) idMap.set(name, ex.id);
              else {
                const { data: ins, error } = await supabase.from("contracts").insert({ name }).select("id").single();
                if (error) throw error;
                idMap.set(name, ins.id);
              }
            }
          }
          raw.forEach(r => r.contract_id = idMap.get(r.contract)!);

          weeklyRows += await chunkUpsert(supabase, "cot_weekly", raw, "contract_id,report_date");

          const metrics = buildMetrics(raw);
          metricRows += await chunkUpsert(supabase, "cot_metrics", metrics, "contract_id,report_date");

          console.log(`${y}: weekly +${raw.length} / metrics +${metrics.length}`);
        } catch (e) {
          const msg = `${y}: ${(e as Error).message}`;
          console.error(msg);
          errors.push(msg);
        }
      }

      await supabase.from("refresh_log").insert({
        rows_inserted: weeklyRows + metricRows,
        rows_updated: 0,
        error: errors.length ? errors.join("; ") : null
      });

      return json({ status: errors.length ? "partial" : "completed", weekly_rows: weeklyRows, metric_rows: metricRows, errors });
    }

    if (url.pathname.endsWith("/refresh/status")) {
      const { data } = await supabase.from("refresh_log").select("*").order("id", { ascending: false }).limit(1).single();
      return json(data || { run_at: null, rows_inserted: 0, rows_updated: 0, error: null });
    }

    if (url.pathname.endsWith("/cot/latest")) {
      const { data, error } = await supabase.from("cot_latest").select("*, contracts(name,sector)");
      if (error) throw error;
      return json(data ?? []);
    }

    if (url.pathname.endsWith("/cot/range")) {
      const contract_id = url.searchParams.get("contract_id")!;
      const from        = url.searchParams.get("from")!;
      const to          = url.searchParams.get("to")!;
      const { data, error } = await supabase
        .from("cot_metrics")
        .select("*")
        .eq("contract_id", contract_id)
        .gte("report_date", from)
        .lte("report_date", to)
        .order("report_date", { ascending: true });
      if (error) throw error;
      return json(data ?? []);
    }

    return json({ error: "Not Found" }, 404);
  } catch (err: any) {
    console.error(err);
    return json({ error: err.message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

function range(a: number, b: number) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

/** Download and parse TXT ZIP */
async function fetchYearTXT(year: number): Promise<RawRow[]> {
  const url = `https://www.cftc.gov/files/dea/history/fut_disagg_txt_${year}.zip`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  const zip = await JSZip.loadAsync(buf);
  const txtName = Object.keys(zip.files).find(f => f.endsWith(".txt"));
  if (!txtName) throw new Error("No .txt file found in zip");
  const txt = await zip.file(txtName)!.async("string");
  return parseTxt(txt);
}

/** Parse the CFTC CSV (txt) */
function parseTxt(txt: string): RawRow[] {
  const lines = txt.trim().split(/\r?\n/);
  const header = lines.shift()!.split(",");
  const idx = (name: string) => header.indexOf(name);

  const out: RawRow[] = [];
  for (const line of lines) {
    const cols = line.split(",");
    const r: RawRow = {
      contract: cols[idx("Market_and_Exchange_Names")],
      report_date: cols[idx("Report_Date_as_YYYY-MM-DD")],
      prod_class: cols[idx("ProdClass")],
      comm_long: +cols[idx("Commercial_Positions_Long_All")],
      comm_short:+cols[idx("Commercial_Positions_Short_All")],
      ls_long:   +cols[idx("Noncommercial_Positions_Long_All")],
      ls_short:  +cols[idx("Noncommercial_Positions_Short_All")],
      ss_long:   +cols[idx("Nonreportable_Positions_Long_All")],
      ss_short:  +cols[idx("Nonreportable_Positions_Short_All")]
    };
    if (r.report_date) out.push(r);
  }
  return out;
}

/** Upsert in chunks */
async function chunkUpsert(supabase:any, table:string, rows:any[], conflict:string) {
  const size = 500;
  let inserted = 0;
  for (let i=0;i<rows.length;i+=size) {
    const chunk = rows.slice(i, i+size);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: conflict });
    if (error) throw error;
    inserted += chunk.length;
  }
  return inserted;
}

/** Build metrics with rolling 156-week percentile & WoW deltas */
function buildMetrics(raw: RawRow[]): MetricRow[] {
  const byId = new Map<string, RawRow[]>();
  raw.forEach(r => {
    const arr = byId.get(r.contract_id!) || [];
    arr.push(r);
    byId.set(r.contract_id!, arr);
  });

  const metrics: MetricRow[] = [];

  for (const [cid, arr] of byId) {
    arr.sort((a,b)=> a.report_date.localeCompare(b.report_date));

    const comm = arr.map(r => r.comm_long - r.comm_short);
    const ls   = arr.map(r => r.ls_long   - r.ls_short);
    const ss   = arr.map(r => r.ss_long   - r.ss_short);

    for (let i=0;i<arr.length;i++) {
      const commSlice = comm.slice(Math.max(0,i-(LOOKBACK-1)), i+1);
      const lsSlice   = ls.slice(Math.max(0,i-(LOOKBACK-1)), i+1);
      const ssSlice   = ss.slice(Math.max(0,i-(LOOKBACK-1)), i+1);

      metrics.push({
        contract_id: cid,
        report_date: arr[i].report_date,
        comm_net: comm[i],
        ls_net: ls[i],
        ss_net: ss[i],
        comm_index: pctRank(commSlice),
        ls_index: pctRank(lsSlice),
        ss_index: pctRank(ssSlice),
        wow_comm_delta: i===0 ? null : comm[i]-comm[i-1],
        wow_ls_delta:   i===0 ? null : ls[i]-ls[i-1],
        wow_ss_delta:   i===0 ? null : ss[i]-ss[i-1],
      });
    }
  }
  return metrics;
}

/** Percentile rank of last value */
function pctRank(values:number[]):number {
  if (!values.length) return 0;
  const last = values[values.length-1];
  const sorted = [...values].sort((a,b)=>a-b);
  const rank = sorted.findIndex(v=>v>=last)+1;
  return (rank / sorted.length) * 100;
}