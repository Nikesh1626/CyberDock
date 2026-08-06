# CyberDock — Full Implementation Plan
### Automated Container Vulnerability Analysis & Runtime Security Sandbox
**Team size:** 3 members | **Type:** Final Year Major Project

---

## 1. Team & Module Split

The architecture in your PPT naturally splits into 3 independent tracks. Assign one member per track so everyone has ownership end-to-end (frontend + backend + DB for their slice), instead of splitting purely by "frontend guy / backend guy" — that always causes integration pain in final-year projects.

| Member | Track | Owns |
|---|---|---|
| **M1 — Platform & Auth Lead** | User Management + Project Upload + Orchestration Core | React dashboard shell, Supabase Auth, Project Upload (GitHub/ZIP/Dockerfile), FastAPI orchestration engine, Task Queue |
| **M2 — Security Scanning Lead** | Static Analysis Engine | Docker image build automation, Trivy integration, CodeQL integration, Dependency Analysis, vulnerability result parsing |
| **M3 — Runtime & Reporting Lead** | Sandbox Runtime Monitoring + Forensic Reports | Isolated container execution, Python runtime monitoring engine (network/process/file/resource), Result Aggregator, PDF/JSON report generation, dashboard visualizations |

All three integrate through **one shared FastAPI backend repo** and **one shared Supabase schema**, defined together in Phase 0 so nobody blocks anyone later.

---

## 2. Technology Stack (final)

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React.js + Vite, Tailwind CSS, Recharts/Chart.js | Dashboard, upload, reports |
| Backend | FastAPI (Python) | REST API + orchestration |
| Async Jobs | Celery + Redis (or FastAPI BackgroundTasks for MVP) | Scan queue, background builds |
| Database/Auth | Supabase (PostgreSQL + Auth) | Users, projects, scans, reports |
| Containerization | Docker Engine + Docker SDK for Python | Image build, sandbox lifecycle |
| Vulnerability Scanner | Trivy (CLI, JSON output) | Image/OS/dependency scan |
| Static Code Analysis | CodeQL (CLI or GitHub Action) | Source-level security queries |
| Runtime Monitoring | Python (psutil, scapy/socket, watchdog) or eBPF/Falco (stretch goal) | Process, network, file, resource monitoring |
| File Storage | Supabase Storage or local `/data` volume | Reports, logs, screenshots |
| Version Control | Git + GitHub | One repo, feature branches |
| Deployment (demo) | Docker Compose on a single VM (or local for viva) | Simplifies final demo |

---

## 3. Build Phases (Timeline: ~14–16 weeks, adjust to your semester)

### **Phase 0 — Setup & Contracts (Week 1–2)** — *All 3 together*
1. Create GitHub repo (monorepo: `/frontend`, `/backend`, `/monitoring-engine`, `/docs`).
2. Set branching strategy: `main` → protected, `dev` → integration, feature branches `feat/<name>`.
3. Design and freeze the **Supabase schema** together (this is the contract between all 3 members):
   - `users`, `projects`, `scan_jobs`, `vulnerabilities`, `runtime_events`, `reports`, `audit_logs`.
4. Define the **REST API contract** (OpenAPI spec) — endpoint names, request/response JSON — even before logic is written, so frontend and other backends can mock against it.
5. Each member sets up local dev env: Docker, Python 3.11+, Node, Trivy, CodeQL CLI.
6. Deliverable: architecture doc + ER diagram + API contract, reviewed by guide/mentor.

### **Phase 1 — Core Platform: Auth + Upload (Week 3–4)** — *M1 leads*
1. Supabase Auth integration (signup/login/JWT).
2. React dashboard shell: login, project list, upload page.
3. FastAPI `/auth` and `/projects` endpoints; store project metadata.
4. Upload handling for 3 input types: GitHub repo URL clone, ZIP upload, raw Dockerfile.
5. Input validation module: file size limits, allowed file types, basic malware/hash check.
6. Deliverable: user can sign up, log in, and upload a project — data lands in Supabase.

### **Phase 2 — Docker Build Automation (Week 4–5)** — *M1 + M2*
1. FastAPI service uses Docker SDK to build an image from uploaded source.
2. Capture build logs, surface build errors to the dashboard.
3. Tag/version images per scan job; clean up old images (disk management).
4. Deliverable: any uploaded repo/Dockerfile reliably produces a built image or a clear build-failure report.

### **Phase 3 — Static Vulnerability Analysis (Week 5–7)** — *M2 leads*
1. Integrate **Trivy**: scan built image → JSON output → parse into `vulnerabilities` table (CVE ID, severity, package, fix version).
2. Integrate **CodeQL**: run security queries against source code → parse SARIF output → store code-level findings.
3. Build the **Dependency Analysis** module: parse `package.json`/`requirements.txt`/`pom.xml` etc., cross-check against NVD/CVE feeds for outdated/vulnerable packages.
4. Normalize all findings into one unified schema (severity: Critical/High/Medium/Low) so the dashboard can render them consistently regardless of source tool.
5. Deliverable: given an image, the system returns a structured, deduplicated vulnerability report.

### **Phase 4 — Isolated Sandbox Execution (Week 6–8)** — *M3 leads (parallel to Phase 3)*
1. Launch the built image as a container with **restricted resources** (`--memory`, `--cpus`) and **restricted network** (custom bridge network with egress control, or `--network=none` + controlled allowlist).
2. Define a safe execution window (timeout) after which the sandbox auto-terminates.
3. Ensure container runs with least privilege (`--cap-drop=ALL`, non-root user, read-only rootfs where possible).
4. Deliverable: any image can be safely spun up and torn down without touching the host.

### **Phase 5 — Runtime Behavioral Monitoring (Week 8–10)** — *M3 leads*
1. **Process monitoring**: track process tree inside the container (via Docker API / `docker top` / psutil in a sidecar).
2. **Network monitoring**: capture outbound connections, DNS queries, flag connections to non-allowlisted IPs/domains.
3. **File integrity monitoring**: watch for unexpected file writes, especially outside expected app directories.
4. **Resource monitoring**: CPU, memory, disk I/O — flag anomalies (e.g., crypto-mining-like spikes).
5. Stream/log all events into `runtime_events` table with timestamps and severity tags.
6. Deliverable: a running container produces a real-time behavioral event log.

### **Phase 6 — Result Aggregation & Forensic Reporting (Week 10–11)** — *M3 + M1*
1. Result Aggregator service: pulls from `vulnerabilities` + `runtime_events`, correlates (e.g., "vulnerable package X was also observed opening network connection Y").
2. Generate **PDF report** (e.g., WeasyPrint or ReportLab) and **JSON report** (raw machine-readable).
3. Store reports in Supabase Storage, link to `projects`/`scan_jobs`.
4. Add basic recommendation engine: map common CVEs/behaviors to remediation text (can start as a rules table).
5. Deliverable: one-click "Generate Report" produces a downloadable PDF + JSON.

### **Phase 7 — Dashboard & Visualization (Week 11–12)** — *M1 leads, all contribute*
1. Project history view, scan comparison over time.
2. Severity breakdown charts (Recharts/Chart.js): critical/high/medium/low counts.
3. Runtime timeline view (network events, process spawns) — this is the "wow" screen for your demo/viva.
4. Notifications (email via a simple SMTP/service) on scan completion or critical finding.
5. Deliverable: fully navigable dashboard tying together upload → scan → runtime → report.

### **Phase 8 — Integration, Testing & Hardening (Week 12–14)**
1. End-to-end integration testing across all 3 modules — run a real vulnerable sample app (e.g., OWASP `NodeGoat`, `DVWA` container) through the full pipeline.
2. Load/edge-case testing: bad Dockerfiles, huge repos, malicious payloads, network exhaustion attempts.
3. Security-harden the platform itself: sandbox escape checks, resource limits enforced, input sanitization.
4. Fix bugs, polish UI, write unit tests for each module (pytest for backend, Jest for frontend).
5. Deliverable: stable end-to-end demo-ready system.

### **Phase 9 — Documentation & Final Demo Prep (Week 14–16)**
1. Write the project report (Problem Statement → Abstract → Design → Implementation → Results → Conclusion) — you already have most of this from your PPT.
2. Prepare architecture diagrams, ER diagram, sequence diagrams (you already have a workflow diagram — formalize it).
3. Record a demo video / prepare live-demo script with a known vulnerable sample app.
4. Prepare individual contribution summary for each member (guides usually ask for this).

---

## 4. Suggested Weekly Working Process (so all 3 stay in sync)

1. **Weekly sync (30–45 min):** each member demos current progress on their branch, even if incomplete.
2. **Shared API contract file** (`/docs/api-contract.md`) — nobody changes an endpoint shape without flagging it to the other two.
3. **`dev` branch integration every Friday** — merge feature branches, resolve conflicts together, not solo at 2am before submission.
4. **Shared Supabase project** (one dev instance) so everyone works against the same real schema instead of divergent local mocks.
5. Use GitHub Issues/Projects board with 3 swimlanes (one per member) mapped to the phases above.

---

## 5. Risk Areas to Watch

- **Docker-in-Docker / sandbox security**: if your demo machine doesn't support nested virtualization well, test container isolation early (Phase 4), not in week 13.
- **CodeQL setup**: CodeQL CLI has a learning curve and language-specific query packs — budget extra time here, or fall back to Semgrep as a lighter alternative if CodeQL becomes a blocker.
- **Runtime network monitoring inside Docker**: getting clean network visibility from inside a container without root/eBPF can be tricky — a Docker-API-based sidecar (inspecting `docker network` stats) is the most reliable MVP approach; eBPF/Falco is a strong stretch goal but risky this late in a semester.
- **Scope creep**: the PPT lists 6 features — treat User Auth, Docker Build, Vulnerability Scan, and Runtime Monitoring as **must-have**; treat advanced anomaly detection/ML-based scoring as **stretch goals** only if time remains after Phase 8.

---

## 6. MVP Definition (what "done" means if time runs short)

A minimum viable CyberDock must: accept a GitHub repo upload → build the Docker image → run Trivy scan → run the app briefly in an isolated container while logging network + process activity → generate a single PDF report with findings. Everything else (CodeQL, dependency graphing, email alerts, charts) layers on top of this core loop.
