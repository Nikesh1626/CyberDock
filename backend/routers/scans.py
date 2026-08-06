from fastapi import APIRouter
from typing import List
from schemas import ScanResponse

router = APIRouter()

@router.post("/projects/{project_id}/scans", status_code=202)
async def trigger_scan(project_id: str):
    """Trigger a new scan job for the project."""
    return {
        "scan_id": "stubbed-scan-uuid",
        "status": "queued",
        "message": "Scan job successfully queued."
    }

@router.get("/projects/{project_id}/scans", response_model=List[ScanResponse])
async def list_scans(project_id: str):
    """List all historical scans for a project."""
    return []

@router.get("/scans/{scan_id}", response_model=ScanResponse)
async def get_scan_status(scan_id: str):
    """Poll the real-time status of a specific scan job."""
    return {
        "id": scan_id,
        "project_id": "stubbed-project-uuid",
        "status": "scanning",
        "progress": 45,
        "started_at": "2026-08-06T10:05:00Z",
        "completed_at": None,
        "logs": [
            "[INFO] Docker image built successfully.",
            "[INFO] Initiating Trivy static analysis..."
        ]
    }
