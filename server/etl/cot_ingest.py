import os
import requests
import pandas as pd
import zipfile
import io
from datetime import datetime, date
from supabase import create_client, Client
from typing import Dict, Any
import numpy as np

# Configuration
START_YEAR = 2008
CFTC_BASE_URL = "https://www.cftc.gov/files/dea/history"

# Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)

def rolling_percentile(series: pd.Series, window: int = 156) -> float:
    """Calculate the percentile rank of the last value within a rolling window."""
    if len(series) < 2:
        return 50.0
    
    # Get the rolling window
    window_data = series.tail(min(window, len(series)))
    last_value = series.iloc[-1]
    
    # Calculate percentile rank
    rank = (window_data < last_value).sum()
    percentile = (rank / len(window_data)) * 100
    
    return round(percentile, 2)

def compute_indices(df: pd.DataFrame, lookback: int = 156) -> pd.DataFrame:
    """Compute 0-100 indices for commercial, large spec, and small spec positions."""
    df = df.copy()
    df['comm_index'] = df.groupby('contract_id')['comm_net'].transform(
        lambda x: x.rolling(window=min(lookback, len(x)), min_periods=1).apply(rolling_percentile)
    )
    df['ls_index'] = df.groupby('contract_id')['ls_net'].transform(
        lambda x: x.rolling(window=min(lookback, len(x)), min_periods=1).apply(rolling_percentile)
    )
    df['ss_index'] = df.groupby('contract_id')['ss_net'].transform(
        lambda x: x.rolling(window=min(lookback, len(x)), min_periods=1).apply(rolling_percentile)
    )
    return df

def ingest_year(year: int) -> Dict[str, Any]:
    """Download, process, and upsert CFTC data for a given year."""
    print(f"Processing year {year}...")
    
    # Download the zip file
    zip_url = f"{CFTC_BASE_URL}/fut_disagg_xls_{year}.zip"
    response = requests.get(zip_url)
    response.raise_for_status()
    
    # Extract and read the Excel file
    with zipfile.ZipFile(io.BytesIO(response.content)) as zip_file:
        excel_files = [f for f in zip_file.namelist() if f.endswith('.xls')]
        if not excel_files:
            raise ValueError(f"No Excel file found in {zip_url}")
        
        excel_file = excel_files[0]
        with zip_file.open(excel_file) as excel_data:
            df = pd.read_excel(excel_data, engine='xlrd')
    
    # Clean column names and select relevant columns
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_').str.replace('_positions', '')
    
    required_cols = [
        'report_date_as_yyyy-mm-dd', 'market_and_exchange_names', 
        'commodity_name', 'commodity_subgroup_name',
        'commercial_long', 'commercial_short',
        'noncommercial_long', 'noncommercial_short', 
        'nonreportable_long', 'nonreportable_short',
        'open_interest_all'
    ]
    
    # Filter for required columns that exist
    available_cols = [col for col in required_cols if col in df.columns]
    df = df[available_cols].copy()
    
    # Rename columns to match our schema
    column_mapping = {
        'report_date_as_yyyy-mm-dd': 'report_date',
        'market_and_exchange_names': 'name',
        'commodity_subgroup_name': 'sector',
        'commercial_long': 'comm_long',
        'commercial_short': 'comm_short',
        'noncommercial_long': 'ls_long',
        'noncommercial_short': 'ls_short',
        'nonreportable_long': 'ss_long',
        'nonreportable_short': 'ss_short',
        'open_interest_all': 'open_interest'
    }
    df = df.rename(columns=column_mapping)
    
    # Filter for futures only (exclude options and combined)
    df = df[df['name'].str.contains('FUTURES ONLY', case=False, na=False)]
    
    # Clean contract names
    df['name'] = df['name'].str.replace(' - CHICAGO MERCANTILE EXCHANGE', '')
    df['name'] = df['name'].str.replace(' - FUTURES ONLY', '')
    df['name'] = df['name'].str.replace(' - COMMODITY EXCHANGE INC.', '')
    df['name'] = df['name'].str.strip()
    
    # Convert date column
    df['report_date'] = pd.to_datetime(df['report_date'])
    
    # Upsert contracts
    contracts_data = df[['name', 'sector']].drop_duplicates()
    for _, row in contracts_data.iterrows():
        try:
            # Check if contract exists
            existing = supabase.table("contracts").select("id").eq("name", row['name']).execute()
            if not existing.data:
                # Insert new contract
                supabase.table("contracts").insert({
                    "name": row['name'],
                    "sector": row['sector'] or 'Unknown'
                }).execute()
        except Exception as e:
            print(f"Error upserting contract {row['name']}: {e}")
    
    # Get contract IDs
    contracts = supabase.table("contracts").select("id, name").execute()
    contract_map = {c['name']: c['id'] for c in contracts.data}
    
    # Add contract IDs to dataframe
    df['contract_id'] = df['name'].map(contract_map)
    df = df.dropna(subset=['contract_id'])
    
    # Prepare data for cot_weekly table
    weekly_data = []
    for _, row in df.iterrows():
        weekly_data.append({
            'contract_id': row['contract_id'],
            'report_date': row['report_date'].strftime('%Y-%m-%d'),
            'comm_long': int(row['comm_long']) if pd.notna(row['comm_long']) else 0,
            'comm_short': int(row['comm_short']) if pd.notna(row['comm_short']) else 0,
            'ls_long': int(row['ls_long']) if pd.notna(row['ls_long']) else 0,
            'ls_short': int(row['ls_short']) if pd.notna(row['ls_short']) else 0,
            'ss_long': int(row['ss_long']) if pd.notna(row['ss_long']) else 0,
            'ss_short': int(row['ss_short']) if pd.notna(row['ss_short']) else 0,
            'open_interest': int(row['open_interest']) if pd.notna(row['open_interest']) else 0
        })
    
    # Upsert to cot_weekly
    if weekly_data:
        try:
            supabase.table("cot_weekly").upsert(weekly_data).execute()
            print(f"Upserted {len(weekly_data)} rows to cot_weekly")
        except Exception as e:
            print(f"Error upserting weekly data: {e}")
    
    # Calculate metrics
    df['comm_net'] = df['comm_long'] - df['comm_short']
    df['ls_net'] = df['ls_long'] - df['ls_short']
    df['ss_net'] = df['ss_long'] - df['ss_short']
    
    # Sort by contract and date for rolling calculations
    df = df.sort_values(['contract_id', 'report_date'])
    
    # Compute indices
    df = compute_indices(df)
    
    # Calculate week-over-week deltas
    df['wow_comm_delta'] = df.groupby('contract_id')['comm_net'].diff().fillna(0)
    df['wow_ls_delta'] = df.groupby('contract_id')['ls_net'].diff().fillna(0)
    df['wow_ss_delta'] = df.groupby('contract_id')['ss_net'].diff().fillna(0)
    
    # Prepare data for cot_metrics table
    metrics_data = []
    for _, row in df.iterrows():
        metrics_data.append({
            'contract_id': row['contract_id'],
            'report_date': row['report_date'].strftime('%Y-%m-%d'),
            'comm_net': int(row['comm_net']),
            'ls_net': int(row['ls_net']),
            'ss_net': int(row['ss_net']),
            'comm_index': float(row['comm_index']),
            'ls_index': float(row['ls_index']),
            'ss_index': float(row['ss_index']),
            'wow_comm_delta': int(row['wow_comm_delta']),
            'wow_ls_delta': int(row['wow_ls_delta']),
            'wow_ss_delta': int(row['wow_ss_delta'])
        })
    
    # Upsert to cot_metrics
    if metrics_data:
        try:
            supabase.table("cot_metrics").upsert(metrics_data).execute()
            print(f"Upserted {len(metrics_data)} rows to cot_metrics")
        except Exception as e:
            print(f"Error upserting metrics data: {e}")
    
    return {
        "year": year,
        "weekly_rows": len(weekly_data),
        "metrics_rows": len(metrics_data)
    }

def full_backfill() -> Dict[str, Any]:
    """Orchestrate the full ingestion process from START_YEAR to current year."""
    start_time = datetime.now()
    current_year = datetime.now().year
    total_weekly_rows = 0
    total_metrics_rows = 0
    errors = []
    
    try:
        for year in range(START_YEAR, current_year + 1):
            try:
                result = ingest_year(year)
                total_weekly_rows += result["weekly_rows"]
                total_metrics_rows += result["metrics_rows"]
            except Exception as e:
                error_msg = f"Failed to process year {year}: {str(e)}"
                print(error_msg)
                errors.append(error_msg)
        
        # Log the results
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        log_entry = {
            "run_at": start_time.isoformat(),
            "rows_inserted": total_weekly_rows + total_metrics_rows,
            "rows_updated": 0,  # We're doing upserts, so this would need more logic to track
            "error": "; ".join(errors) if errors else None
        }
        
        supabase.table("refresh_log").insert(log_entry).execute()
        
        return {
            "status": "completed",
            "duration_seconds": duration,
            "total_weekly_rows": total_weekly_rows,
            "total_metrics_rows": total_metrics_rows,
            "errors": errors
        }
        
    except Exception as e:
        # Log the error
        error_entry = {
            "run_at": start_time.isoformat(),
            "rows_inserted": total_weekly_rows + total_metrics_rows,
            "rows_updated": 0,
            "error": str(e)
        }
        supabase.table("refresh_log").insert(error_entry).execute()
        raise

if __name__ == "__main__":
    full_backfill()