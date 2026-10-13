from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import HTMLResponse
from typing import List, Optional
from schemas import VulnerabilityResponse, RuntimeEventResponse, DashboardSummaryResponse
from database import supabase

router = APIRouter()

@router.get("/scans/{scan_id}/vulnerabilities", response_model=List[VulnerabilityResponse])
async def get_vulnerabilities(scan_id: str):
    """Get the static analysis findings for a scan."""
    try:
        res = supabase.table("vulnerabilities").select("*").eq("scan_id", scan_id).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scans/{scan_id}/runtime-events", response_model=List[RuntimeEventResponse])
async def get_runtime_events(scan_id: str):
    """Get behavioral anomalies detected during sandbox execution."""
    try:
        res = supabase.table("runtime_events")\
            .select("*")\
            .eq("scan_id", scan_id)\
            .order("timestamp", desc=False)\
            .execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scans/{scan_id}/report")
async def get_report(scan_id: str, format: str = "json"):
    """Generate and return the aggregated forensic report."""
    try:
        # 1. Fetch Scan Job
        scan_res = supabase.table("scan_jobs").select("*").eq("id", scan_id).execute()
        if not scan_res.data:
            raise HTTPException(status_code=404, detail="Scan job not found")
        scan = scan_res.data[0]

        # 2. Fetch Project
        project_res = supabase.table("projects").select("*").eq("id", scan["project_id"]).execute()
        project = project_res.data[0] if project_res.data else {}

        # 3. Fetch Findings & Runtime Events
        vulns_res = supabase.table("vulnerabilities").select("*").eq("scan_id", scan_id).execute()
        events_res = supabase.table("runtime_events").select("*").eq("scan_id", scan_id).execute()
        vulns = vulns_res.data or []
        events = events_res.data or []

        # Correlate Risk Score
        critical_count = sum(1 for v in vulns if v.get("severity") == "CRITICAL")
        high_count = sum(1 for v in vulns if v.get("severity") == "HIGH")
        medium_count = sum(1 for v in vulns if v.get("severity") == "MEDIUM")
        low_count = sum(1 for v in vulns if v.get("severity") == "LOW")

        risk_score = min(100, (critical_count * 25) + (high_count * 15) + (medium_count * 5) + (len(events) * 10))

        if format.lower() == "html":
            html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>CyberDock Security Forensic Report - {scan_id[:8]}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f1f5f9; padding: 40px; margin: 0; }}
        .container {{ max-width: 900px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 32px; border: 1px solid #334155; }}
        .header {{ border-b: 1px solid #334155; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }}
        .badge {{ padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; text-transform: uppercase; }}
        .badge-crit {{ background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }}
        .badge-high {{ background: rgba(249, 115, 22, 0.2); color: #f97316; border: 1px solid #f97316; }}
        .card {{ background: #0f172a; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #334155; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
        th, td {{ text-align: left; padding: 10px; border-bottom: 1px solid #334155; font-size: 14px; }}
        th {{ color: #94a3b8; font-weight: 600; }}
        .print-btn {{ background: #3b82f6; color: white; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: bold; }}
    </style>
</head>
<body>
    <div class="container">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
            <div>
                <h1 style="margin:0; color:#38bdf8;">CyberDock Security Forensic Report</h1>
                <p style="color:#94a3b8; margin: 4px 0 0 0;">Project: <strong>{project.get('name', 'Unknown')}</strong> | Scan ID: {scan_id}</p>
            </div>
            <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
        </div>

        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 24px 0;">
            <div class="card" style="text-align:center;">
                <div style="color:#94a3b8; font-size:12px;">RISK SCORE</div>
                <div style="font-size:28px; font-weight:bold; color:{'#ef4444' if risk_score > 60 else '#f97316' if risk_score > 30 else '#22c55e'};">{risk_score}/100</div>
            </div>
            <div class="card" style="text-align:center;">
                <div style="color:#94a3b8; font-size:12px;">CRITICAL CVEs</div>
                <div style="font-size:28px; font-weight:bold; color:#ef4444;">{critical_count}</div>
            </div>
            <div class="card" style="text-align:center;">
                <div style="color:#94a3b8; font-size:12px;">HIGH CVEs</div>
                <div style="font-size:28px; font-weight:bold; color:#f97316;">{high_count}</div>
            </div>
            <div class="card" style="text-align:center;">
                <div style="color:#94a3b8; font-size:12px;">RUNTIME ANOMALIES</div>
                <div style="font-size:28px; font-weight:bold; color:#38bdf8;">{len(events)}</div>
            </div>
        </div>

        <h3>Static Vulnerabilities ({len(vulns)})</h3>
        <table>
            <thead>
                <tr>
                    <th>Severity</th>
                    <th>CVE ID</th>
                    <th>Package / Location</th>
                    <th>Installed</th>
                    <th>Fixed In</th>
                    <th>Scanner</th>
                </tr>
            </thead>
            <tbody>
                {''.join(f"<tr><td><span class='badge badge-crit' style='color:{'#ef4444' if v.get('severity') == 'CRITICAL' else '#f97316' if v.get('severity') == 'HIGH' else '#eab308'}; border-color: currentColor;'>{v.get('severity')}</span></td><td><strong>{v.get('cve_id')}</strong></td><td>{v.get('package')}</td><td>{v.get('installed_version') or 'N/A'}</td><td><span style='color:#22c55e;'>{v.get('fixed_version') or 'N/A'}</span></td><td>{v.get('source_tool')}</td></tr>" for v in vulns)}
            </tbody>
        </table>

        <h3 style="margin-top: 36px;">Runtime Behavioral Forensics ({len(events)})</h3>
        <table>
            <thead>
                <tr>
                    <th>Event Type</th>
                    <th>Severity</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                {''.join(f"<tr><td style='text-transform: capitalize;'><strong>{e.get('event_type')}</strong></td><td><span class='badge badge-high'>{e.get('severity')}</span></td><td>{e.get('description')}</td></tr>" for e in events)}
            </tbody>
        </table>
    </div>
</body>
</html>
            """
            return HTMLResponse(content=html_content)

        # Default JSON response
        return {
            "scan_id": scan_id,
            "project": {
                "id": project.get("id"),
                "name": project.get("name"),
                "source_type": project.get("source_type"),
                "source_url": project.get("source_url")
            },
            "risk_score": risk_score,
            "status": scan.get("status"),
            "started_at": scan.get("started_at"),
            "completed_at": scan.get("completed_at"),
            "summary": {
                "total_vulnerabilities": len(vulns),
                "critical": critical_count,
                "high": high_count,
                "medium": medium_count,
                "low": low_count,
                "runtime_anomalies_count": len(events)
            },
            "vulnerabilities": vulns,
            "runtime_events": events,
            "remediation_recommendations": [
                f"Upgrade vulnerable dependency '{v.get('package')}' to version {v.get('fixed_version')}"
                for v in vulns if v.get("fixed_version")
            ]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/summary")
async def get_dashboard_metrics():
    """Retrieve global aggregated metrics across all projects and scans."""
    try:
        # Total projects
        proj_res = supabase.table("projects").select("id", count="exact").execute()
        total_projects = proj_res.count if proj_res.count is not None else len(proj_res.data or [])

        # Total scans & completed scans
        scans_res = supabase.table("scan_jobs").select("id, status, started_at, project_id").order("started_at", desc=True).execute()
        all_scans = scans_res.data or []
        total_scans = len(all_scans)
        completed_scans = sum(1 for s in all_scans if s.get("status") == "completed")

        # Vulnerabilities
        vuln_res = supabase.table("vulnerabilities").select("severity").execute()
        all_vulns = vuln_res.data or []
        crit_count = sum(1 for v in all_vulns if v.get("severity") == "CRITICAL")
        high_count = sum(1 for v in all_vulns if v.get("severity") == "HIGH")
        med_count = sum(1 for v in all_vulns if v.get("severity") == "MEDIUM")
        low_count = sum(1 for v in all_vulns if v.get("severity") == "LOW")

        severity_breakdown = [
            {"name": "Critical", "value": crit_count, "color": "#ef4444"},
            {"name": "High", "value": high_count, "color": "#f97316"},
            {"name": "Medium", "value": med_count, "color": "#eab308"},
            {"name": "Low", "value": low_count, "color": "#3b82f6"},
        ]

        # Recent 5 scans
        recent_scans = all_scans[:5]

        return {
            "total_projects": total_projects,
            "total_scans": total_scans,
            "critical_issues": crit_count,
            "completed_scans": completed_scans,
            "severity_breakdown": severity_breakdown,
            "recent_scans": recent_scans
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
