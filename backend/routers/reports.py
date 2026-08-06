from fastapi import APIRouter
from typing import List
from schemas import VulnerabilityResponse, RuntimeEventResponse

router = APIRouter()

@router.get("/scans/{scan_id}/vulnerabilities", response_model=List[VulnerabilityResponse])
async def get_vulnerabilities(scan_id: str):
    """Get the static analysis findings."""
    return [
        {
            "id": "uuid",
            "cve_id": "CVE-2021-44228",
            "severity": "CRITICAL",
            "package_name": "log4j-core",
            "installed_version": "2.14.1",
            "fixed_version": "2.15.0",
            "source_tool": "Trivy"
        }
    ]

@router.get("/scans/{scan_id}/runtime-events", response_model=List[RuntimeEventResponse])
async def get_runtime_events(scan_id: str):
    """Get behavioral anomalies detected during sandbox execution."""
    return [
        {
            "id": "uuid",
            "timestamp": "2026-08-06T10:08:12Z",
            "event_type": "network",
            "severity": "HIGH",
            "description": "Container attempted outbound connection to blacklisted IP 198.51.100.14 on port 4444"
        }
    ]

@router.get("/scans/{scan_id}/report")
async def get_report(scan_id: str, format: str = "json"):
    """Generate and download the aggregated forensic report."""
    return {"message": f"Stubbed report in {format} format for scan {scan_id}"}
