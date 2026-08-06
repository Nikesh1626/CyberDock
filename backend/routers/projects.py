from fastapi import APIRouter, UploadFile, File, Form
from typing import List, Optional
from schemas import ProjectResponse

router = APIRouter()

@router.get("/", response_model=List[ProjectResponse])
async def get_projects():
    """List all projects for the authenticated user."""
    return []

@router.post("/", response_model=ProjectResponse, status_code=201)
async def create_project(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    source_type: str = Form(...),
    source_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """Create a new project and upload/link the source."""
    return {
        "id": "stubbed-uuid",
        "name": name,
        "description": description,
        "source_type": source_type,
        "source_url": source_url,
        "created_at": "2026-08-06T10:00:00Z"
    }

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """Get details of a specific project."""
    return {
        "id": project_id,
        "name": "NodeGoat Vuln App",
        "description": "OWASP sample app",
        "source_type": "github",
        "source_url": "https://github.com/OWASP/NodeGoat",
        "created_at": "2026-08-06T10:00:00Z"
    }
