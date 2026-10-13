import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Terminal, ShieldAlert, Activity, CheckCircle2, 
  AlertTriangle, Download, ExternalLink, RefreshCw, Loader2, 
  FileText, Cpu, Network, FileCode2, Layers
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../lib/api';

const PIPELINE_STEPS = [
  { id: 'queued', label: 'Queued' },
  { id: 'building', label: 'Building Image' },
  { id: 'scanning', label: 'Static Analysis' },
  { id: 'sandboxing', label: 'Sandbox Monitoring' },
  { id: 'completed', label: 'Completed' },
];

export default function ScanDetails() {
  const { id } = useParams();
  const [scan, setScan] = useState(null);
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [runtimeEvents, setRuntimeEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('vulns');
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const logContainerRef = useRef(null);

  useEffect(() => {
    fetchScanData();

    // Set polling interval while scan is executing
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/scans/${id}`);
        setScan(res.data);
        if (res.data.status === 'completed' || res.data.status === 'failed') {
          clearInterval(interval);
          // Fetch findings and runtime events once finished
          fetchFindings();
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [id]);

  const fetchScanData = async () => {
    try {
      setLoading(true);
      const scanRes = await api.get(`/scans/${id}`);
      setScan(scanRes.data);
      if (scanRes.data.status === 'completed') {
        await fetchFindings();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFindings = async () => {
    try {
      const [vulnRes, eventRes] = await Promise.all([
        api.get(`/scans/${id}/vulnerabilities`),
        api.get(`/scans/${id}/runtime-events`)
      ]);
      setVulnerabilities(vulnRes.data);
      setRuntimeEvents(eventRes.data);
    } catch (err) {
      console.error('Error fetching findings:', err);
    }
  };

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [scan?.logs]);

  const getStepStatus = (stepId) => {
    if (!scan) return 'waiting';
    const current = scan.status;
    const order = ['queued', 'building', 'scanning', 'sandboxing', 'completed'];
    const currentIndex = order.indexOf(current);
    const stepIndex = order.indexOf(stepId);

    if (current === 'failed') return 'failed';
    if (currentIndex > stepIndex || current === 'completed') return 'done';
    if (currentIndex === stepIndex) return 'active';
    return 'waiting';
  };

  // Severity counts for Recharts
  const critCount = vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
  const highCount = vulnerabilities.filter(v => v.severity === 'HIGH').length;
  const medCount = vulnerabilities.filter(v => v.severity === 'MEDIUM').length;
  const lowCount = vulnerabilities.filter(v => v.severity === 'LOW').length;

  const chartData = [
    { name: 'Critical', value: critCount, color: '#ef4444' },
    { name: 'High', value: highCount, color: '#f97316' },
    { name: 'Medium', value: medCount, color: '#eab308' },
    { name: 'Low', value: lowCount, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  const filteredVulns = vulnerabilities.filter(v => {
    const matchesSev = filterSeverity === 'ALL' || v.severity === filterSeverity;
    const matchesSearch = !searchTerm || 
      v.cve_id.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (v.package && v.package.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSev && matchesSearch;
  });

  if (loading && !scan) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-slate-400">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm">Connecting to scan pipeline...</p>
      </div>
    );
  }

  const isFinished = scan?.status === 'completed';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to={`/projects/${scan?.project_id}`} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-100">Scan Pipeline Execution</h1>
              <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                {scan?.id}
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Started: {scan?.started_at ? new Date(scan.started_at).toLocaleTimeString() : 'N/A'} • Progress: {scan?.progress || 0}%
            </p>
          </div>
        </div>

        {isFinished && (
          <div className="flex items-center gap-3">
            <a
              href={`http://127.0.0.1:8000/api/v1/scans/${id}/report?format=html`}
              target="_blank"
              rel="noreferrer"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors border border-slate-700"
            >
              <FileText className="w-4 h-4 mr-2 text-cyan-400" /> Printable Report
            </a>
            <a
              href={`http://127.0.0.1:8000/api/v1/scans/${id}/report?format=json`}
              download={`cyberdock-scan-${id}.json`}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
            >
              <Download className="w-4 h-4 mr-2" /> Export JSON
            </a>
          </div>
        )}
      </div>

      {/* Pipeline Stepper Visualizer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {PIPELINE_STEPS.map((step, idx) => {
            const status = getStepStatus(step.id);
            return (
              <div key={step.id} className="flex flex-col items-center text-center relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-all ${
                  status === 'done' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' :
                  status === 'active' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40 animate-pulse' :
                  status === 'failed' ? 'bg-red-500/20 text-red-400 border border-red-500' :
                  'bg-slate-800 text-slate-500 border border-slate-700'
                }`}>
                  {status === 'done' ? <CheckCircle2 className="w-5 h-5" /> :
                   status === 'active' ? <Loader2 className="w-5 h-5 animate-spin" /> :
                   status === 'failed' ? <AlertTriangle className="w-5 h-5" /> : idx + 1}
                </div>
                <span className={`text-xs font-medium ${
                  status === 'active' ? 'text-blue-400 font-bold' :
                  status === 'done' ? 'text-slate-200' : 'text-slate-500'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Progress bar */}
        <div className="mt-6 w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
          <div 
            className={`h-full transition-all duration-700 ${
              scan?.status === 'completed' ? 'bg-gradient-to-r from-blue-500 to-emerald-400' :
              scan?.status === 'failed' ? 'bg-red-500' : 'bg-gradient-to-r from-blue-600 to-indigo-500'
            }`}
            style={{ width: `${scan?.progress || 0}%` }}
          />
        </div>
      </div>

      {/* Terminal Live Console */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="bg-slate-900/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-mono font-medium text-slate-300">pipeline-execution.log</span>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {scan?.status === 'completed' ? 'Process finished' : 'Live streaming...'}
          </span>
        </div>
        <div 
          ref={logContainerRef}
          className="p-4 h-56 overflow-y-auto font-mono text-xs space-y-1 bg-black/60 scrollbar-thin"
        >
          {scan?.logs?.map((line, idx) => (
            <div 
              key={idx} 
              className={
                line.includes('[SUCCESS]') ? 'text-emerald-400' :
                line.includes('[ALERT]') ? 'text-orange-400 font-semibold' :
                line.includes('[ERROR]') ? 'text-red-400 font-bold' :
                line.includes('[WARN]') ? 'text-yellow-400' :
                line.includes('[STAGE') ? 'text-cyan-300 font-semibold' :
                'text-slate-300'
              }
            >
              {line}
            </div>
          ))}
          {!isFinished && (
            <div className="flex items-center text-blue-400 text-xs animate-pulse pt-1">
              <span className="inline-block w-2 h-4 bg-blue-500 mr-2" /> Orchestrating container tasks...
            </div>
          )}
        </div>
      </div>

      {/* Results Section (Tabs) */}
      <div className="space-y-6">
        <div className="flex border-b border-slate-800">
          <button
            onClick={() => setActiveTab('vulns')}
            className={`flex items-center py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'vulns' 
                ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 mr-2" /> Static Vulnerabilities ({vulnerabilities.length})
          </button>
          <button
            onClick={() => setActiveTab('runtime')}
            className={`flex items-center py-3 px-6 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'runtime' 
                ? 'border-blue-500 text-blue-400 bg-blue-500/5' 
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4 mr-2" /> Runtime Sandbox Forensics ({runtimeEvents.length})
          </button>
        </div>

        {/* Tab 1: Static Vulnerabilities */}
        {activeTab === 'vulns' && (
          <div className="space-y-6">
            {/* Quick Chart & Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Critical Issues</p>
                  <p className="text-2xl font-bold text-red-500 mt-1">{critCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">High Issues</p>
                  <p className="text-2xl font-bold text-orange-500 mt-1">{highCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Medium Issues</p>
                  <p className="text-2xl font-bold text-yellow-500 mt-1">{medCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 font-medium">Low Issues</p>
                  <p className="text-2xl font-bold text-blue-500 mt-1">{lowCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Filter toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <input 
                type="text" 
                placeholder="Search CVE ID or Package..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 w-full sm:w-80 focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filterSeverity === sev ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Vulnerabilities Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <table className="min-w-full divide-y divide-slate-800">
                <thead className="bg-slate-950/40">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Vulnerability</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Component</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Installed</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Fixed In</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Scanner</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-900 divide-y divide-slate-800/60">
                  {filteredVulns.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-slate-500 text-sm">
                        {vulnerabilities.length === 0 ? 'No static findings detected yet or scan in-flight.' : 'No vulnerabilities match filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredVulns.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            v.severity === 'CRITICAL' ? 'bg-red-500/15 text-red-400 border border-red-500/30' :
                            v.severity === 'HIGH' ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30' :
                            v.severity === 'MEDIUM' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' :
                            'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          }`}>
                            {v.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-semibold text-slate-200">
                          {v.cve_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono text-xs">
                          {v.package || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-mono">
                          {v.installed_version || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-emerald-400 font-semibold">
                          {v.fixed_version || 'Upgrade required'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                          <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                            {v.source_tool}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Runtime Sandbox Forensics */}
        {activeTab === 'runtime' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-200">Sandbox Behavioral Event Log</h3>
                <p className="text-xs text-slate-400">Captured in isolated container namespace under strict security egress controls.</p>
              </div>
              <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 text-xs font-mono border border-blue-500/20">
                {runtimeEvents.length} events logged
              </span>
            </div>

            {runtimeEvents.length === 0 ? (
              <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-sm">
                No runtime behavioral anomalies logged or sandboxing still pending.
              </div>
            ) : (
              <div className="space-y-3">
                {runtimeEvents.map((event) => (
                  <div 
                    key={event.id}
                    className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-2.5 rounded-lg mt-0.5 ${
                        event.event_type === 'network' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        event.event_type === 'process' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        event.event_type === 'file_integrity' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      }`}>
                        {event.event_type === 'network' ? <Network className="w-5 h-5" /> :
                         event.event_type === 'process' ? <Layers className="w-5 h-5" /> :
                         event.event_type === 'file_integrity' ? <FileCode2 className="w-5 h-5" /> :
                         <Cpu className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-slate-200 uppercase tracking-wide">
                            {event.event_type.replace('_', ' ')} Event
                          </span>
                          <span className={`px-2 py-0.5 rounded text-2xs font-bold uppercase ${
                            event.severity === 'HIGH' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {event.severity}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                          {event.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-slate-500 whitespace-nowrap self-end sm:self-center">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
