from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Any
from datetime import datetime

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    source_type: str
    source_url: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: str
    user_id: Optional[str] = None
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
    scan_id: Optional[str] = None
    cve_id: str
    severity: str
    package: Optional[str] = None
    package_name: Optional[str] = None
    installed_version: Optional[str] = None
    fixed_version: Optional[str] = None
    source_tool: str

    class Config:
        from_attributes = True

class RuntimeEventResponse(BaseModel):
    id: str
    scan_id: Optional[str] = None
    timestamp: datetime
    event_type: str
    severity: str
    description: str

    class Config:
        from_attributes = True

class DashboardSummaryResponse(BaseModel):
    total_projects: int
    total_scans: int
    critical_issues: int
    completed_scans: int
    severity_breakdown: List[dict]
    recent_scans: List[dict]
