import os, io, zipfile, requests, pandas as pd, numpy as np
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import Dict, Any, List

load_dotenv()

CFTC_BASE = "https://www.cftc.gov/files/dea/history"
START_YEAR = int(os.getenv("START_YEAR", "2008"))
LOOKBACK_WEEKS = int(os.getenv("LOOKBACK_WEEKS", "156"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_KEY  = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_URL or not SERVICE_KEY:
    raise RuntimeError("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env")

sb: Client = create_client(SUPABASE_URL, SERVICE_KEY)

def pct_rank_last(series: pd.Series) -> float:
    return series.rank(pct=True).iloc[-1] * 100

def rolling_indices(df: pd.DataFrame) -> pd.DataFrame:
    for grp, col in [("comm","comm_net"), ("ls","ls_net"), ("ss","ss_net")]:
        df[f"{grp}_index"] = (
            df.groupby("contract_id")[col]
              .rolling(LOOKBACK_WEEKS, min_periods=1)
              .apply(pct_rank_last, raw=False)
              .reset_index(level=0, drop=True)
        )
    return df

def chunk_upsert(table: str, rows: List[Dict[str, Any]], conflict_cols: str):
    for i in range(0, len(rows), 500):
        sb.table(table).upsert(rows[i:i+500], on_conflict=conflict_cols).execute()

def download_year(year: int) -> pd.DataFrame:
    url = f"{CFTC_BASE}/fut_disagg_xls_{year}.zip"
    r = requests.get(url, timeout=60)
    r.raise_for_status()

    zf = zipfile.ZipFile(io.BytesIO(r.content))
    xls_name = [n for n in zf.namelist() if n.endswith(".xls")][0]
    with zf.open(xls_name) as f:
        df = pd.read_excel(f, engine="xlrd")

    rename_map = {
        'Market_and_Exchange_Names': 'contract',
        'Report_Date_as_YYYY-MM-DD': 'report_date',
        'ProdClass': 'prod_class',
        'Commercial_Positions_Long_All': 'comm_long',
        'Commercial_Positions_Short_All': 'comm_short',
        'Noncommercial_Positions_Long_All': 'ls_long',
        'Noncommercial_Positions_Short_All': 'ls_short',
        'Nonreportable_Positions_Long_All': 'ss_long',
        'Nonreportable_Positions_Short_All': 'ss_short',
        'Open_Interest_All': 'open_interest'
    }
    df = df.rename(columns=rename_map)

    needed = ['contract','report_date','prod_class',
              'comm_long','comm_short','ls_long','ls_short','ss_long','ss_short']
    df = df[needed].dropna(subset=['report_date'])
    return df

def ingest_year(year: int, contract_ids: Dict[str,str]) -> Dict[str,int]:
    df = download_year(year)

    # contracts
    for name in df['contract'].unique():
        if name not in contract_ids:
            res = sb.table("contracts").select("id").eq("name", name).execute()
            if res.data:
                contract_ids[name] = res.data[0]['id']
            else:
                ins = sb.table("contracts").insert({"name": name}).execute()
                contract_ids[name] = ins.data[0]['id']

    df['contract_id'] = df['contract'].map(contract_ids)

    raw_rows = df.to_dict("records")
    chunk_upsert("cot_weekly", raw_rows, "contract_id,report_date")

    df = df.sort_values(['contract_id','report_date'])
    df['comm_net'] = df['comm_long'] - df['comm_short']
    df['ls_net']   = df['ls_long']   - df['ls_short']
    df['ss_net']   = df['ss_long']   - df['ss_short']

    df = rolling_indices(df)

    df['wow_comm_delta'] = df.groupby('contract_id')['comm_net'].diff()
    df['wow_ls_delta']   = df.groupby('contract_id')['ls_net'].diff()
    df['wow_ss_delta']   = df.groupby('contract_id')['ss_net'].diff()

    met_cols = ['contract_id','report_date','comm_net','ls_net','ss_net',
                'comm_index','ls_index','ss_index',
                'wow_comm_delta','wow_ls_delta','wow_ss_delta']
    met_rows = df[met_cols].to_dict("records")
    chunk_upsert("cot_metrics", met_rows, "contract_id,report_date")

    return {"weekly": len(raw_rows), "metrics": len(met_rows)}

def full_backfill(start_year: int = START_YEAR) -> Dict[str, Any]:
    start = datetime.utcnow()
    total_w = total_m = 0
    errors: List[str] = []

    existing = sb.table("contracts").select("id,name").execute()
    contract_ids = {c['name']: c['id'] for c in (existing.data or [])}

    for y in range(start_year, datetime.utcnow().year + 1):
        try:
            counts = ingest_year(y, contract_ids)
            total_w += counts["weekly"]
            total_m += counts["metrics"]
            print(f"{y} ✓ {counts}")
        except Exception as e:
            errors.append(f"{y}: {e}")
            print(f"{y} ✗ {e}")

    sb.table("refresh_log").insert({
        "rows_inserted": total_w + total_m,
        "rows_updated": 0,
        "error": "; ".join(errors) if errors else None
    }).execute()

    return {
        "status": "completed" if not errors else "partial",
        "duration_seconds": (datetime.utcnow() - start).total_seconds(),
        "weekly_rows": total_w,
        "metric_rows": total_m,
        "errors": errors
    }

if __name__ == "__main__":
    print(full_backfill())
