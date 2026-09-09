# CyberDock UI Design Specification

This document outlines all the necessary screens, UI components, and design guidelines for the CyberDock platform based on the system architecture and REST API contract.

## 1. Design Aesthetics & Layout
* **Theme:** A modern, clean dashboard (preferably dark-mode or a sleek light-mode with high contrast for data readability).
* **Color Coding (Severity):** 
  * 🔴 **Critical:** Red
  * 🟠 **High:** Orange
  * 🟡 **Medium:** Yellow
  * 🔵 **Low / Info:** Blue or Gray
* **Application Shell:**
  * **Sidebar/Navbar:** Navigation links (Dashboard, Projects, Reports), User Profile, Logout.
  * **Top Bar:** Breadcrumb navigation, Notifications (optional), and contextual actions.

---

## 2. Needed Screens

### 2.1 Authentication & Onboarding
* **Login Screen:** Email and password fields, "Sign In" button, link to register.
* **Sign-up Screen:** Name, Email, Password, "Create Account" button.
* *(Uses Supabase Auth)*

### 2.2 Global Dashboard (Home)
The landing page after logging in, providing a bird's-eye view of the user's workspaces.
* **Metrics Cards:** Total Projects, Scans Run This Week, Critical Vulnerabilities across all projects.
* **Global Severity Chart:** A Recharts/Chart.js donut or bar chart showing the breakdown of vulnerabilities across all projects.
* **Recent Scans Activity:** A quick-glance table showing the last 5 scans (Project Name, Status, Date).

### 2.3 Project Management
#### 2.3.1 Projects List Page
* **Data View:** A data table or card grid displaying all projects.
  * Columns/Fields: Project Name, Source Type (GitHub, ZIP, Dockerfile), Last Scan Date, Last Scan Status.
* **Primary Action:** `[+ New Project]` button.

#### 2.3.2 Create Project (Modal or Separate Page)
* **Form Inputs:**
  * Project Name (Text)
  * Description (Textarea, Optional)
  * Source Type (Radio/Dropdown): GitHub Repo, ZIP Archive, or Raw Dockerfile.
  * Dynamic Input: 
    * If GitHub: URL text input.
    * If ZIP/Dockerfile: Drag-and-drop file uploader area.
* **Action:** `[Create Project]` button.

#### 2.3.3 Project Details Page
* **Header:** Project Name, Source URL/Type, Creation Date.
* **Primary Action:** `[▶ Trigger New Scan]` button (Optionally with a dropdown for scan configuration).
* **Scan History List:** A table showing all historical scans for this specific project.
  * Columns: Scan ID/Date, Status (Queued, Building, Scanning, Sandboxing, Completed, Failed), Quick Summary (e.g., "5 Critical, 12 High").
  * Clicking a row navigates to the detailed Scan Results view.

### 2.4 Scan Execution & Live Progress
*When a user triggers a new scan, they are navigated here to watch the progress.*
* **Stepper / Pipeline Visualizer:**
  `Queued` ➔ `Building Image` ➔ `Static Scanning` ➔ `Sandboxing` ➔ `Completed`
* **Real-time Logs Console:** A black, terminal-like container displaying WebSocket or polled logs (`[INFO] Docker image built successfully...`).
* **Status Indicators:** Spinners for in-progress steps, green checks for completed, red crosses for failures.

### 2.5 Scan Results & Forensics (The Core Detail View)
*This is the most critical screen for the final presentation, accessible after a scan completes.*

#### 2.5.1 Summary & Actions Header
* **Actions:** `[📄 Download PDF Report]`, `[{ } Download JSON]`
* **Quick Stats:** Total Issues, Sandbox Execution Time.

#### 2.5.2 Tab 1: Static Vulnerabilities (Trivy & CodeQL)
* **Visuals:** Severity breakdown chart specifically for this scan.
* **Vulnerabilities Table:**
  * Columns: Severity Badge, CVE ID, Package Name, Installed Version, Fixed Version, Source Tool (Trivy/CodeQL).
  * Functionality: Sort by Severity, Search by CVE or Package.

#### 2.5.3 Tab 2: Runtime Behavioral Monitoring
* **Timeline Visualizer (The "Wow" Factor):** A timeline or scatter plot charting when events occurred during the sandbox execution window.
* **Runtime Events Table:**
  * Columns: Timestamp, Event Type (Network, File, Process, Resource), Severity, Description.
  * *Example Row:* `[HIGH] | Network | 10:08:12Z | Container attempted outbound connection to blacklisted IP 198.51.100.14`

---

## 3. Recommended UI Libraries
* **Framework:** React + Vite
* **Styling:** Tailwind CSS
* **Components:** shadcn/ui or MUI (Material UI) for pre-built tables, modals, tabs, and buttons.
* **Charts:** Recharts or Chart.js for severity and timeline visualizations.
* **Icons:** Lucide React or Heroicons.
