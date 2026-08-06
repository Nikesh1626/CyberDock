# CyberDock Supabase Schema Contract

This document defines the PostgreSQL schema for the Supabase database. This schema acts as the single source of truth for the Frontend, Backend, and Monitoring Engine.

---

## Tables

### 1. `profiles`
Extends the default Supabase `auth.users` table with application-specific user data.
* `id` (UUID, Primary Key, References `auth.users.id`)
* `full_name` (Text)
* `avatar_url` (Text, nullable)
* `created_at` (Timestamp, Default `now()`)

### 2. `projects`
Stores metadata about uploaded projects/workspaces.
* `id` (UUID, Primary Key, Default `uuid_generate_v4()`)
* `user_id` (UUID, References `profiles.id`)
* `name` (Text, Required)
* `description` (Text, Nullable)
* `source_type` (Enum: `github`, `zip`, `dockerfile`)
* `source_url` (Text, Nullable) - Used if `source_type` is `github`. ZIPs/Dockerfiles go to Storage.
* `created_at` (Timestamp, Default `now()`)

### 3. `scan_jobs`
Tracks the lifecycle of an orchestration job (Build → Scan → Sandbox).
* `id` (UUID, Primary Key, Default `uuid_generate_v4()`)
* `project_id` (UUID, References `projects.id`)
* `status` (Enum: `queued`, `building`, `scanning`, `sandboxing`, `completed`, `failed`)
* `progress` (Integer, 0-100)
* `started_at` (Timestamp, Nullable)
* `completed_at` (Timestamp, Nullable)
* `created_at` (Timestamp, Default `now()`)

### 4. `vulnerabilities`
Stores findings from static analysis tools (Trivy, CodeQL).
* `id` (UUID, Primary Key, Default `uuid_generate_v4()`)
* `scan_id` (UUID, References `scan_jobs.id`)
* `cve_id` (Text) - e.g., `CVE-2021-44228`
* `severity` (Enum: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `UNKNOWN`)
* `package_name` (Text)
* `installed_version` (Text, Nullable)
* `fixed_version` (Text, Nullable)
* `source_tool` (Text) - e.g., `Trivy`, `CodeQL`, `DependencyCheck`
* `created_at` (Timestamp, Default `now()`)

### 5. `runtime_events`
Stores behavioral anomalies detected during the sandbox execution phase.
* `id` (UUID, Primary Key, Default `uuid_generate_v4()`)
* `scan_id` (UUID, References `scan_jobs.id`)
* `timestamp` (Timestamp)
* `event_type` (Enum: `network`, `file_integrity`, `process`, `resource`)
* `severity` (Enum: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
* `description` (Text) - Detailed context (e.g., "Outbound connection to malicious IP 198.51.100.14")
* `created_at` (Timestamp, Default `now()`)

### 6. `reports`
Metadata for generated forensic reports.
* `id` (UUID, Primary Key, Default `uuid_generate_v4()`)
* `scan_id` (UUID, References `scan_jobs.id`)
* `format` (Enum: `pdf`, `json`)
* `storage_path` (Text) - Path within Supabase Storage bucket.
* `created_at` (Timestamp, Default `now()`)

---

## Supabase Storage Buckets
1. **`project-sources`**: Stores raw `.zip` or `Dockerfile` uploads before they are sent to the build engine.
2. **`scan-reports`**: Stores the generated PDF/JSON forensic reports for long-term download access.

---

## Row Level Security (RLS) Policies
* **Users** can only read, insert, update, and delete their own `projects` and `profiles`.
* **Users** can only read `scan_jobs`, `vulnerabilities`, `runtime_events`, and `reports` that belong to their projects.
* **Backend Service Role** (using Supabase Service Key) has full bypass-RLS access to insert scans, vulnerabilities, and runtime events.
