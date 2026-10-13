import os
import shutil
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from typing import List, Optional
from schemas import ProjectResponse
from database import supabase
from auth import get_current_user

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

@router.get("/", response_model=List[ProjectResponse])
async def get_projects(current_user: Optional[dict] = Depends(get_current_user)):
    """List all projects for the user or workspace."""
    try:
        query = supabase.table("projects").select("*")
        if current_user and current_user.get("id"):
            # Filter by authenticated user, or show projects owned by user / global test projects
            query = query.or_(f"user_id.eq.{current_user['id']},user_id.is.null")
        response = query.order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=ProjectResponse, status_code=201)
async def create_project(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    source_type: str = Form(...),
    source_url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Create a new project and upload/link the source code."""
    valid_sources = ["github", "zip", "dockerfile"]
    if source_type.lower() not in valid_sources:
        raise HTTPException(status_code=400, detail=f"Invalid source_type. Must be one of {valid_sources}")

    user_id = current_user.get("id") if current_user else None
    saved_file_path = None

    # Handle file uploads for ZIP or Dockerfile
    if source_type.lower() in ["zip", "dockerfile"]:
        if not file:
            raise HTTPException(status_code=400, detail=f"File is required when source_type is '{source_type}'.")
        
        # File extension validation
        filename = file.filename or "upload"
        allowed_exts = [".zip", ".tar.gz", ".tar"] if source_type == "zip" else ["dockerfile", ".dockerfile", ".txt", ""]
        is_valid_ext = any(filename.lower().endswith(ext) for ext in allowed_exts) or (source_type == "dockerfile" and "dockerfile" in filename.lower())
        
        if not is_valid_ext:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file extension for {source_type}. Uploaded: {filename}"
            )

        # Generate temporary staging directory
        project_uuid = str(uuid.uuid4())
        dest_dir = os.path.join(UPLOAD_DIR, project_uuid)
        os.makedirs(dest_dir, exist_ok=True)
        dest_path = os.path.join(dest_dir, filename)

        # Stream save file to disk with size check
        total_size = 0
        with open(dest_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                total_size += len(chunk)
                if total_size > MAX_FILE_SIZE:
                    os.remove(dest_path)
                    raise HTTPException(status_code=400, detail="Uploaded file exceeds 50MB limit.")
                buffer.write(chunk)

        saved_file_path = dest_path
        source_url = filename  # Store original file name in source_url

    project_data = {
        "name": name,
        "description": description,
        "source_type": source_type.lower(),
        "source_url": source_url,
    }
    if user_id:
        project_data["user_id"] = user_id

    try:
        response = supabase.table("projects").insert(project_data).execute()
        if not response.data:
            raise HTTPException(status_code=400, detail="Failed to create project in database.")
        
        created_project = response.data[0]
        
        # If we uploaded a file, rename the directory to match the actual created project id
        if saved_file_path and os.path.exists(os.path.dirname(saved_file_path)):
            actual_project_id = created_project["id"]
            final_dir = os.path.join(UPLOAD_DIR, str(actual_project_id))
            if os.path.exists(final_dir):
                shutil.rmtree(final_dir)
            os.rename(os.path.dirname(saved_file_path), final_dir)

        return created_project
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
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: str, current_user: Optional[dict] = Depends(get_current_user)):
    """Delete a project and its associated scan data and files."""
    try:
        # Check project exists
        res = supabase.table("projects").select("id").eq("id", project_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Project not found")

        # Delete from Supabase (cascades to scan_jobs, vulnerabilities, runtime_events, reports)
        supabase.table("projects").delete().eq("id", project_id).execute()

        # Clean up uploaded files if present
        project_upload_dir = os.path.join(UPLOAD_DIR, str(project_id))
        if os.path.exists(project_upload_dir):
            shutil.rmtree(project_upload_dir, ignore_errors=True)

        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
