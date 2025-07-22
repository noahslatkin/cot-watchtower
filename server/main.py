import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from datetime import datetime, date
from typing import Optional, List, Dict, Any
import asyncio
from etl.cot_ingest import full_backfill

app = FastAPI(title="COT Data API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase client initialization
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_KEY")

if not supabase_url or not supabase_key:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables")

supabase: Client = create_client(supabase_url, supabase_key)

@app.get("/")
async def root():
    return {"message": "COT Data API", "version": "1.0.0"}

@app.get("/api/refresh/run")
async def trigger_refresh():
    """Trigger a full data backfill from CFTC."""
    try:
        result = await asyncio.to_thread(full_backfill)
        return {"status": "success", "result": result}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.get("/api/refresh/status")
async def get_refresh_status():
    """Get the status of the last data refresh."""
    try:
        response = supabase.table("refresh_log").select("*").order("id", desc=True).limit(1).execute()
        if response.data:
            return response.data[0]
        return {"run_at": None, "rows_inserted": 0, "rows_updated": 0, "error": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/contracts")
async def get_contracts():
    """Fetch all available contracts."""
    try:
        response = supabase.table("contracts").select("*").order("name").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cot")
async def get_cot_data(
    contract_id: str = Query(...),
    frm: str = Query(...),
    to: str = Query(...)
):
    """Get COT data for a specific contract within a date range."""
    try:
        response = supabase.table("cot_metrics").select(
            "report_date, comm_net, ls_net, ss_net, comm_index, ls_index, ss_index, "
            "wow_comm_delta, wow_ls_delta, wow_ss_delta"
        ).eq("contract_id", contract_id).gte("report_date", frm).lte("report_date", to).order("report_date").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cot/latest")
async def get_latest_cot():
    """Get the latest COT data for all contracts."""
    try:
        response = supabase.from_("cot_latest").select(
            "*, contracts(name, sector)"
        ).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/heatmap")
async def get_heatmap_data(date: str = Query(...)):
    """Get heatmap data for a specified date."""
    try:
        response = supabase.table("cot_metrics").select(
            "*, contracts(name, sector)"
        ).eq("report_date", date).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/extremes")
async def get_extreme_readings(
    min_threshold: float = Query(5),
    max_threshold: float = Query(95)
):
    """Get contracts with extreme commercial index readings."""
    try:
        response = supabase.from_("cot_latest").select(
            "*, contracts(name, sector)"
        ).or_(f"comm_index.lte.{min_threshold},comm_index.gte.{max_threshold}").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/contract/{contract_name}")
async def get_contract_by_name(contract_name: str):
    """Get contract details by name."""
    try:
        response = supabase.table("contracts").select("*").eq("name", contract_name).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Contract not found")
        return response.data[0]
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/debug/latest")
async def debug_latest():
    """Debug endpoint to check data freshness and database status."""
    try:
        # Get latest report date
        latest_response = supabase.table("cot_metrics").select("report_date").order("report_date", desc=True).limit(1).execute()
        latest_date = latest_response.data[0]["report_date"] if latest_response.data else None
        
        # Get row count
        count_response = supabase.table("cot_metrics").select("*", count="exact").execute()
        total_rows = count_response.count
        
        # Get last refresh
        refresh_response = supabase.table("refresh_log").select("*").order("id", desc=True).limit(1).execute()
        last_refresh = refresh_response.data[0] if refresh_response.data else None
        
        return {
            "latest_report_date": latest_date,
            "total_rows": total_rows,
            "last_refresh": last_refresh
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)