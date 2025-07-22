from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
import os
from datetime import datetime
from etl.cot_ingest import full_backfill

app = FastAPI(title="COT Data API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase client
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    raise ValueError("Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

@app.get("/")
def root():
    return {"message": "COT Data API", "version": "1.0.0"}

@app.get("/api/refresh/run")
def run_refresh():
    """Trigger a full data refresh from CFTC"""
    try:
        ins, upd = full_backfill()
        return {"inserted": ins, "updated": upd, "status": "success"}
    except Exception as e:
        return {"error": str(e), "status": "failed"}

@app.get("/api/refresh/status")
def refresh_status():
    """Get the status of the last refresh operation"""
    try:
        res = sb.table('refresh_log').select('*').order('run_at', desc=True).limit(1).execute()
        if res.data:
            return res.data[0]
        else:
            return {"message": "No refresh history found"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/contracts")
def get_contracts():
    """Get all available contracts"""
    try:
        res = sb.table('contracts').select('*').order('name').execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cot")
def get_cot(contract_id: str, frm: str, to: str):
    """Get COT data for a specific contract within date range"""
    try:
        q = (sb.table('cot_metrics')
              .select('*')
              .eq('contract_id', contract_id)
              .gte('report_date', frm)
              .lte('report_date', to)
              .order('report_date'))
        return q.execute().data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cot/latest")
def get_latest():
    """Get latest COT data for all contracts"""
    try:
        # Get latest report date first
        latest_date_res = sb.table('cot_metrics').select('report_date').order('report_date', desc=True).limit(1).execute()
        if not latest_date_res.data:
            return []
        
        latest_date = latest_date_res.data[0]['report_date']
        
        # Get all data for latest date with contract details
        res = (sb.table('cot_metrics')
                 .select('*, contracts(name, sector)')
                 .eq('report_date', latest_date)
                 .execute())
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/heatmap")
def heatmap(date: str = Query(..., description="Date in YYYY-MM-DD format")):
    """Get heatmap data for a specific date"""
    try:
        # Get all metrics for the specified date
        res = (sb.table('cot_metrics')
                 .select('contract_id, report_date, comm_index, ls_index, ss_index, wow_comm_delta, wow_ls_delta, wow_ss_delta, contracts(name, sector)')
                 .eq('report_date', date)
                 .execute())
        
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/extremes")
def get_extremes(min_threshold: float = 5.0, max_threshold: float = 95.0):
    """Get contracts with extreme commercial index readings"""
    try:
        # Get latest date
        latest_date_res = sb.table('cot_metrics').select('report_date').order('report_date', desc=True).limit(1).execute()
        if not latest_date_res.data:
            return []
        
        latest_date = latest_date_res.data[0]['report_date']
        
        # Get extreme readings
        res = (sb.table('cot_metrics')
                 .select('*, contracts(name, sector)')
                 .eq('report_date', latest_date)
                 .or_(f'comm_index.lte.{min_threshold},comm_index.gte.{max_threshold}')
                 .order('comm_index')
                 .execute())
        
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/contract/{contract_name}")
def get_contract_by_name(contract_name: str):
    """Get contract details by name"""
    try:
        res = sb.table('contracts').select('*').eq('name', contract_name).execute()
        if res.data:
            return res.data[0]
        else:
            raise HTTPException(status_code=404, detail="Contract not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/debug/latest")
def debug_latest():
    """Debug endpoint to check data freshness"""
    try:
        # Get latest report date
        latest_res = sb.table('cot_metrics').select('report_date').order('report_date', desc=True).limit(1).execute()
        latest_date = latest_res.data[0]['report_date'] if latest_res.data else None
        
        # Get row count
        count_res = sb.table('cot_metrics').select('*', count='exact').execute()
        row_count = count_res.count
        
        # Get last refresh
        refresh_res = sb.table('refresh_log').select('*').order('run_at', desc=True).limit(1).execute()
        last_refresh = refresh_res.data[0] if refresh_res.data else None
        
        return {
            "latest_report_date": latest_date,
            "rows_in_db": row_count,
            "last_refresh": last_refresh['run_at'] if last_refresh else None,
            "last_refresh_details": last_refresh
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)