import io
import zipfile
import requests
import pandas as pd
from supabase import create_client
from datetime import datetime
import numpy as np
import os

SUPABASE_URL = os.getenv("SUPABASE_URL")
SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
sb = create_client(SUPABASE_URL, SERVICE_KEY)

START_YEAR = 2008
THIS_YEAR = datetime.utcnow().year

def rolling_percentile(series):
    """Calculate percentile of last value within rolling window"""
    return series.rank(pct=True).iloc[-1] * 100

def compute_indices(df, lookback=156):
    """Compute 0-100 indices for commercial, large spec, small spec positions"""
    for grp, net in [('comm', 'comm_net'), ('ls', 'ls_net'), ('ss', 'ss_net')]:
        idx_col = f"{grp}_index"
        df[idx_col] = (
            df.groupby('contract_id')[net]
              .rolling(lookback, min_periods=1)
              .apply(rolling_percentile, raw=False)
              .reset_index(level=0, drop=True)
        )
    return df

def ingest_year(year: int):
    """Download and process CFTC data for a given year"""
    url = f"https://www.cftc.gov/files/dea/history/fut_disagg_xls_{year}.zip"
    print(f"Downloading {url}")
    
    try:
        r = requests.get(url, timeout=60)
        if r.status_code != 200:
            print(f"Skip year {year} - HTTP {r.status_code}")
            return 0, 0
    except Exception as e:
        print(f"Error downloading {year}: {e}")
        return 0, 0

    try:
        zf = zipfile.ZipFile(io.BytesIO(r.content))
        xls_files = [n for n in zf.namelist() if n.endswith(".xls")]
        if not xls_files:
            print(f"No XLS file found in {year} archive")
            return 0, 0
            
        xls = xls_files[0]
        raw = zf.read(xls)
        df = pd.read_excel(io.BytesIO(raw))
    except Exception as e:
        print(f"Error processing {year} XLS: {e}")
        return 0, 0

    # Rename columns to our schema
    df.rename(columns={
        'Market_and_Exchange_Names': 'contract',
        'Report_Date_as_YYYY-MM-DD': 'report_date', 
        'Commercial_Positions_Long_All': 'comm_long',
        'Commercial_Positions_Short_All': 'comm_short',
        'Noncommercial_Positions_Long_All': 'ls_long',
        'Noncommercial_Positions_Short_All': 'ls_short',
        'Nonreportable_Positions_Long_All': 'ss_long',
        'Nonreportable_Positions_Short_All': 'ss_short',
        'ProdClass': 'prod_class',
        'Open_Interest_All': 'open_interest'
    }, inplace=True)

    # Keep only needed columns and drop rows with missing dates
    required_cols = ['contract', 'report_date', 'prod_class', 'comm_long', 'comm_short', 
                    'ls_long', 'ls_short', 'ss_long', 'ss_short', 'open_interest']
    available_cols = [col for col in required_cols if col in df.columns]
    df = df[available_cols].dropna(subset=['report_date'])

    if df.empty:
        print(f"No valid data for {year}")
        return 0, 0

    # Upsert contracts
    contracts = df['contract'].unique()
    contract_ids = {}
    
    for c in contracts:
        c_clean = str(c).strip()
        res = sb.table('contracts').select('id').eq('name', c_clean).execute()
        if not res.data:
            ins = sb.table('contracts').insert({'name': c_clean, 'sector': 'Unknown'}).execute()
            contract_ids[c] = ins.data[0]['id']
        else:
            contract_ids[c] = res.data[0]['id']

    df['contract_id'] = df['contract'].map(contract_ids)
    
    # Upsert raw weekly data
    raw_cols = ['contract_id', 'report_date', 'prod_class', 'comm_long', 'comm_short', 
                'ls_long', 'ls_short', 'ss_long', 'ss_short']
    if 'open_interest' in df.columns:
        raw_cols.append('open_interest')
        
    raw_rows = df[raw_cols].to_dict('records')
    ins_count = 0
    
    for chunk in [raw_rows[i:i+500] for i in range(0, len(raw_rows), 500)]:
        try:
            res = sb.table('cot_weekly').upsert(chunk, on_conflict='contract_id,report_date').execute()
            ins_count += len(chunk)
        except Exception as e:
            print(f"Error inserting raw data chunk: {e}")

    # Calculate metrics
    df['comm_net'] = df['comm_long'] - df['comm_short']
    df['ls_net'] = df['ls_long'] - df['ls_short']
    df['ss_net'] = df['ss_long'] - df['ss_short']
    
    df = df.sort_values(['contract_id', 'report_date'])
    df = compute_indices(df)
    
    # Calculate week-over-week deltas
    df['wow_comm_delta'] = df.groupby('contract_id')['comm_net'].diff()
    df['wow_ls_delta'] = df.groupby('contract_id')['ls_net'].diff()
    df['wow_ss_delta'] = df.groupby('contract_id')['ss_net'].diff()

    # Upsert metrics
    met_cols = ['contract_id', 'report_date', 'comm_net', 'ls_net', 'ss_net', 
                'comm_index', 'ls_index', 'ss_index', 'wow_comm_delta', 'wow_ls_delta', 'wow_ss_delta']
    met_rows = df[met_cols].to_dict('records')

    for chunk in [met_rows[i:i+500] for i in range(0, len(met_rows), 500)]:
        try:
            sb.table('cot_metrics').upsert(chunk, on_conflict='contract_id,report_date').execute()
        except Exception as e:
            print(f"Error inserting metrics chunk: {e}")

    print(f"Processed {year}: {ins_count} rows")
    return ins_count, 0

def full_backfill():
    """Run complete backfill from START_YEAR to current year"""
    total_ins = total_upd = 0
    error_msg = None
    
    try:
        for y in range(START_YEAR, THIS_YEAR + 1):
            ins, upd = ingest_year(y)
            total_ins += ins
            total_upd += upd
    except Exception as e:
        error_msg = str(e)
        print(f"Backfill error: {e}")
    
    # Log the refresh
    sb.table('refresh_log').insert({
        'rows_inserted': total_ins, 
        'rows_updated': total_upd,
        'error': error_msg
    }).execute()
    
    return total_ins, total_upd