# CyberDock REST API Contract

**Base URL:** `/api/v1`

This document defines the REST API endpoints for the CyberDock orchestration backend (FastAPI). All endpoints (except public ones) require authentication via a Supabase JWT in the `Authorization: Bearer <token>` header.

---

## 1. Projects (Phase 1)
Manage user workspaces/projects containing the source code or docker images to be analyzed.

### `GET /projects`
List all projects for the authenticated user.
* **Response `200 OK`**:
```json
[
  {
    "id": "uuid",
    "name": "NodeGoat Vuln App",
    "description": "OWASP sample app",
    "source_type": "github",
    "source_url": "https://github.com/OWASP/NodeGoat",
    "created_at": "2026-08-06T10:00:00Z"
  }
]
```

### `POST /projects`
Create a new project and upload/link the source.
* **Request Body** `multipart/form-data` or `application/json`:
  * `name` (string)
  * `description` (string, optional)
  * `source_type` (string) - `github`, `zip`, or `dockerfile`
  * `source_url` (string, required if `github`)
  * `file` (File, required if `zip` or `dockerfile`)
* **Response `201 Created`**: Returns the created project object.

### `GET /projects/{project_id}`
Get details of a specific project.
* **Response `200 OK`**: Returns project details along with a summary of recent scans.

---

## 2. Scans & Orchestration (Phase 2, 3, 4, 5)
Manage the automated pipeline (Build → Static Scan → Sandbox Execution).

### `POST /projects/{project_id}/scans`
Trigger a new scan job for the project. This queues the background celery task.
* **Request Body**: (Optional configuration overrides like specific scanner flags or timeout limits).
* **Response `202 Accepted`**:
```json
{
  "scan_id": "uuid",
  "status": "queued",
  "message": "Scan job successfully queued."
}
```

### `GET /projects/{project_id}/scans`
List all historical scans for a project.
* **Response `200 OK`**: Array of scan objects with their status (`queued`, `building`, `scanning`, `sandboxing`, `completed`, `failed`).

### `GET /scans/{scan_id}`
Poll the real-time status of a specific scan job.
* **Response `200 OK`**:
```json
{
  "id": "uuid",
  "project_id": "uuid",
  "status": "scanning",
  "progress": 45,
  "started_at": "2026-08-06T10:05:00Z",
  "completed_at": null,
  "logs": [
    "[INFO] Docker image built successfully.",
    "[INFO] Initiating Trivy static analysis..."
  ]
}
```

---

## 3. Results & Reports (Phase 6 & 7)
Retrieve static vulnerabilities, runtime events, and aggregated reports.

### `GET /scans/{scan_id}/vulnerabilities`
Get the static analysis findings (Trivy, CodeQL, Dependency).
* **Response `200 OK`**:
```json
[
  {
    "id": "uuid",
    "cve_id": "CVE-2021-44228",
    "severity": "CRITICAL",
    "package": "log4j-core",
    "installed_version": "2.14.1",
    "fixed_version": "2.15.0",
    "source_tool": "Trivy"
  }
]
```

### `GET /scans/{scan_id}/runtime-events`
Get behavioral anomalies detected during sandbox execution.
* **Response `200 OK`**:
```json
[
  {
    "id": "uuid",
    "timestamp": "2026-08-06T10:08:12Z",
    "event_type": "network",
    "severity": "HIGH",
    "description": "Container attempted outbound connection to blacklisted IP 198.51.100.14 on port 4444"
  },
  {
    "id": "uuid",
    "timestamp": "2026-08-06T10:08:15Z",
    "event_type": "file_integrity",
    "severity": "MEDIUM",
    "description": "Unexpected write to /etc/passwd"
  }
]
```

### `GET /scans/{scan_id}/report`
Generate and download the aggregated forensic report.
* **Query Params**: `format=pdf` or `format=json`
* **Response**: Returns a downloadable file (PDF) or the raw JSON schema.

---

## 4. System (Optional)
### `GET /health`
Basic health check for the FastAPI backend, Celery workers, and database connection.
* **Response `200 OK`**: `{"status": "healthy"}`
