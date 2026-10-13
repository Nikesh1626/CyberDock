from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import List, Optional
from schemas import ScanResponse
from database import supabase
from services.scanner import run_scan_pipeline

router = APIRouter()

@router.post("/projects/{project_id}/scans", status_code=202)
async def trigger_scan(project_id: str, background_tasks: BackgroundTasks):
    """Trigger a new scan job for the project."""
    try:
        # Verify project exists
        proj_res = supabase.table("projects").select("id, name").eq("id", project_id).execute()
        if not proj_res.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Create scan job in Supabase
        scan_payload = {
            "project_id": project_id,
            "status": "queued",
            "progress": 5,
            "logs": ["[INFO] Scan job queued and dispatched to worker."]
        }
        res = supabase.table("scan_jobs").insert(scan_payload).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to initialize scan record.")

        new_scan = res.data[0]
        scan_id = new_scan["id"]

        # Launch automated security pipeline asynchronously
        background_tasks.add_task(run_scan_pipeline, scan_id, project_id)

        return {
            "scan_id": scan_id,
            "status": "queued",
            "message": "Scan job successfully queued."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/projects/{project_id}/scans", response_model=List[ScanResponse])
async def list_scans(project_id: str):
    """List all historical scans for a project."""
    try:
        res = supabase.table("scan_jobs")\
            .select("*")\
            .eq("project_id", project_id)\
            .order("started_at", desc=True)\
            .execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scans/{scan_id}", response_model=ScanResponse)
async def get_scan_status(scan_id: str):
    """Poll the real-time status of a specific scan job."""
    try:
        res = supabase.table("scan_jobs").select("*").eq("id", scan_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Scan job not found")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
