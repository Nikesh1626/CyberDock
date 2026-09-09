from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List, Optional
from schemas import ProjectResponse
from database import supabase

router = APIRouter()

@router.get("/", response_model=List[ProjectResponse])
async def get_projects():
    """List all projects."""
    try:
        # Fetch all projects from Supabase
        response = supabase.table("projects").select("*").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=ProjectResponse, status_code=201)
async def create_project(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    source_type: str = Form(...),
    source_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None)
):
    """Create a new project and upload/link the source."""
    
    # Construct the data payload
    project_data = {
        "name": name,
        "description": description,
        "source_type": source_type,
        "source_url": source_url,
        # user_id would normally be extracted from the JWT token of the authenticated user
    }
    
    try:
        # Insert into Supabase
        response = supabase.table("projects").insert(project_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create project")
            
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    """Get details of a specific project."""
    try:
        response = supabase.table("projects").select("*").eq("id", project_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Project not found")
            
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
