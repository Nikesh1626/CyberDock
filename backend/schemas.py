from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    source_type: str
    source_url: Optional[HttpUrl] = None

class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

class ScanResponse(BaseModel):
    id: str
    project_id: str
    status: str
    progress: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    logs: Optional[List[str]] = None
    
    class Config:
        from_attributes = True

class VulnerabilityResponse(BaseModel):
    id: str
    cve_id: str
    severity: str
    package_name: str
    installed_version: Optional[str] = None
    fixed_version: Optional[str] = None
    source_tool: str

    class Config:
        from_attributes = True

class RuntimeEventResponse(BaseModel):
    id: str
    timestamp: datetime
    event_type: str
    severity: str
    description: str

    class Config:
        from_attributes = True
