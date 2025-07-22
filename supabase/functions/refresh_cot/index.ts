// supabase/functions/refresh_cot/index.ts
// deno run --allow-env --allow-net
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
const LOOKBACK = 156;
const START_YEAR = 2008;

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
      const mode = url.searchParams.get("mode") ?? "full";
      const yearParam = url.searchParams.get("year");
      const startYear = yearParam ? parseInt(yearParam) : START_YEAR;
      const thisYear = new Date().getFullYear();

      let weeklyRows = 0, metricRows = 0;
      const errors: string[] = [];

      // cache contracts
      const { data: existingContracts } = await supabase.from("contracts").select("id,name");
      const contractIds = new Map<string,string>(existingContracts?.map((c:any)=>[c.name,c.id]) ?? []);

      const years = mode === "full" ? range(startYear, thisYear) : [startYear];

      for (const y of years) {
        try {
          const raw = await fetchYearTXT(y); // returns RawRow[]
          // upsert contracts
          for (const name of new Set(raw.map(r => r.contract))) {
            if (!contractIds.has(name)) {
              const { data: ex } = await supabase.from("contracts").select("id").eq("name", name).maybeSingle();
              if (ex) contractIds.set(name, ex.id);
              else {
                const { data: ins } = await supabase.from("contracts").insert({ name }).select("id").single();
                contractIds.set(name, ins.id);
              }
            }
          }

          // attach contract_id
          raw.forEach(r => (r as any).contract_id = contractIds.get(r.contract));

          // upsert cot_weekly in chunks
          weeklyRows += await chunkUpsert(supabase, "cot_weekly", raw, "contract_id,report_date");

          // build metrics & upsert
          const metrics = buildMetrics(raw as any[]);
          metricRows += await chunkUpsert(supabase, "cot_metrics", metrics, "contract_id,report_date");

          console.log(`${y} done: weekly=${weeklyRows} metrics=${metricRows}`);
        } catch (e) {
          const msg = `${y}: ${(e as Error).message}`;
          console.error(msg);
          errors.push(msg);
        }
      }

      await supabase.from("refresh_log").insert({
        rows_inserted: weeklyRows + metricRows,
        rows_updated: 0,
        error: errors.length ? errors.join("; ") : null,
      });

      return json({ status: errors.length ? "partial" : "completed", weekly_rows: weeklyRows, metric_rows: metricRows, errors });
    }

    if (url.pathname.endsWith("/refresh/status")) {
      const { data } = await supabase.from("refresh_log").select("*").order("id", { ascending: false }).limit(1).single();
      return json(data || { run_at: null, rows_inserted: 0, rows_updated: 0, error: null });
    }

    if (url.pathname.endsWith("/cot/latest")) {
      const { data } = await supabase.from("cot_latest").select("*, contracts(name,sector)");
      return json(data ?? []);
    }

    return json({ error: "Not Found" }, 404);
  } catch (err: any) {
    console.error(err);
    return json({ error: err.message }, 500);
  }
}, { onListen: () => console.log("Edge function up") });

/* ---------- Helpers ---------- */

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function range(a: number, b: number) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

/** Download & parse TXT ZIP (fut_disagg_txt_YEAR.zip) */
async function fetchYearTXT(year: number): Promise<RawRow[]> {
  const url = `https://www.cftc.gov/files/dea/history/fut_disagg_txt_${year}.zip`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = new Uint8Array(await res.arrayBuffer());

  const zip = await JSZip.loadAsync(buf);
  const first = Object.keys(zip.files).find(f => f.endsWith(".txt"));
  if (!first) throw new Error("No txt in zip");

  const txt = await zip.file(first)!.async("string");
  return parseTxt(txt);
}

/** Parse CFTC TXT format (comma-separated). Adjust indexes if CFTC changes headers. */
function parseTxt(txt: string): RawRow[] {
  const lines = txt.trim().split(/\r?\n/);
  const header = lines.shift()!.split(",");
  const idx = (name: string) => header.indexOf(name);

  const out: RawRow[] = [];
  for (const line of lines) {
    const cols = line.split(",");
    const row: RawRow = {
      contract: cols[idx("Market_and_Exchange_Names")],
      report_date: cols[idx("Report_Date_as_YYYY-MM-DD")],
      prod_class: cols[idx("ProdClass")],
      comm_long: +cols[idx("Commercial_Positions_Long_All")],
      comm_short: +cols[idx("Commercial_Positions_Short_All")],
      ls_long: +cols[idx("Noncommercial_Positions_Long_All")],
      ls_short: +cols[idx("Noncommercial_Positions_Short_All")],
      ss_long: +cols[idx("Nonreportable_Positions_Long_All")],
      ss_short: +cols[idx("Nonreportable_Positions_Short_All")],
    };
    if (row.report_date) out.push(row);
  }
  return out;
}

/** Chunked upsert helper */
async function chunkUpsert(supabase: any, table: string, rows: any[], conflict: string): Promise<number> {
  const chunkSize = 500;
  let count = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: conflict });
    if (error) throw error;
    count += chunk.length;
  }
  return count;
}

/** Build metric rows (rolling 156-week indices + WoW deltas) */
function buildMetrics(raw: (RawRow & { contract_id: string })[]): MetricRow[] {
  // group by contract_id sorted by date
  const groups = new Map<string, (RawRow & { contract_id: string })[]>();
  raw.forEach(r => {
    const arr = groups.get(r.contract_id) || [];
    arr.push(r);
    groups.set(r.contract_id, arr);
  });

  const metrics: MetricRow[] = [];
  for (const [cid, arr] of groups) {
    arr.sort((a, b) => a.report_date.localeCompare(b.report_date));

    const commNet: number[] = [];
    const lsNet: number[] = [];
    const ssNet: number[] = [];

    arr.forEach(r => {
      commNet.push(r.comm_long - r.comm_short);
      lsNet.push(r.ls_long - r.ls_short);
      ssNet.push(r.ss_long - r.ss_short);
    });

    for (let i = 0; i < arr.length; i++) {
      const commSlice = commNet.slice(Math.max(0, i - (LOOKBACK - 1)), i + 1);
      const lsSlice   = lsNet.slice(Math.max(0, i - (LOOKBACK - 1)), i + 1);
      const ssSlice   = ssNet.slice(Math.max(0, i - (LOOKBACK - 1)), i + 1);

      const row: MetricRow = {
        contract_id: cid,
        report_date: arr[i].report_date,
        comm_net: commNet[i],
        ls_net: lsNet[i],
        ss_net: ssNet[i],
        comm_index: pctRank(commSlice),
        ls_index: pctRank(lsSlice),
        ss_index: pctRank(ssSlice),
        wow_comm_delta: i === 0 ? null : commNet[i] - commNet[i - 1],
        wow_ls_delta:   i === 0 ? null : lsNet[i]   - lsNet[i - 1],
        wow_ss_delta:   i === 0 ? null : ssNet[i]   - ssNet[i - 1],
      };
      metrics.push(row);
    }
  }
  return metrics;
}

/** Percentile rank of last value in an array (0–100) */
function pctRank(values: number[]): number {
  if (values.length === 0) return 0;
  const last = values[values.length - 1];
  const sorted = [...values].sort((a, b) => a - b);
  const rank = sorted.findIndex(v => v >= last) + 1;
  return (rank / sorted.length) * 100;
}