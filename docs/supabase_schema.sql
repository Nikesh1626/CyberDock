-- CyberDock Supabase Schema

-- 1. Projects Table
-- Stores metadata about the uploaded repositories/codebases.
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    source_type TEXT NOT NULL CHECK (source_type IN ('github', 'zip', 'dockerfile')),
    source_url TEXT, -- Used if source_type is github
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Secure Projects table with Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON projects FOR DELETE USING (auth.uid() = user_id);


-- 2. Scan Jobs Table
-- Tracks the execution state of an automated build & scan pipeline.
CREATE TABLE scan_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'building', 'scanning', 'sandboxing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    logs JSONB DEFAULT '[]'::JSONB -- Store build logs as a JSON array
);

-- Secure Scan Jobs
ALTER TABLE scan_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view scan jobs of their projects" ON scan_jobs FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = scan_jobs.project_id AND projects.user_id = auth.uid())
);
-- Backend API will use Service Role Key to insert/update scans, bypassing RLS.


-- 3. Vulnerabilities Table
-- Stores static analysis findings from Trivy/CodeQL.
CREATE TABLE vulnerabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID REFERENCES scan_jobs(id) ON DELETE CASCADE NOT NULL,
    cve_id TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN')),
    package TEXT,
    installed_version TEXT,
    fixed_version TEXT,
    source_tool TEXT NOT NULL -- e.g., 'Trivy', 'CodeQL'
);

ALTER TABLE vulnerabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view vulnerabilities of their scans" ON vulnerabilities FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM scan_jobs 
        JOIN projects ON scan_jobs.project_id = projects.id 
        WHERE scan_jobs.id = vulnerabilities.scan_id AND projects.user_id = auth.uid()
    )
);


-- 4. Runtime Events Table
-- Stores behavioral monitoring logs from the sandbox execution.
CREATE TABLE runtime_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID REFERENCES scan_jobs(id) ON DELETE CASCADE NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    event_type TEXT CHECK (event_type IN ('network', 'file_integrity', 'process', 'resource')),
    severity TEXT CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO')),
    description TEXT NOT NULL
);

ALTER TABLE runtime_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view runtime events of their scans" ON runtime_events FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM scan_jobs 
        JOIN projects ON scan_jobs.project_id = projects.id 
        WHERE scan_jobs.id = runtime_events.scan_id AND projects.user_id = auth.uid()
    )
);


-- 5. Reports Table
-- Stores references to the generated PDF/JSON forensic reports.
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID REFERENCES scan_jobs(id) ON DELETE CASCADE NOT NULL,
    report_url TEXT NOT NULL,
    format TEXT CHECK (format IN ('pdf', 'json')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view reports of their scans" ON reports FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM scan_jobs 
        JOIN projects ON scan_jobs.project_id = projects.id 
        WHERE scan_jobs.id = reports.scan_id AND projects.user_id = auth.uid()
    )
);
