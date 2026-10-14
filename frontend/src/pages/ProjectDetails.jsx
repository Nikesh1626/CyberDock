import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Play, Shield, GitBranch, FileBox, Server, 
  Calendar, CheckCircle2, Clock, AlertTriangle, Loader2, ArrowRight, RefreshCw 
} from 'lucide-react';
import api from '../lib/api';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, scansRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get(`/projects/${id}/scans`)
      ]);
      setProject(projRes.data);
      setScans(scansRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerScan = async () => {
    try {
      setTriggering(true);
      const res = await api.post(`/projects/${id}/scans`);
      const scanId = res.data.scan_id;
      navigate(`/scans/${scanId}`);
    } catch (err) {
      alert('Failed to trigger scan: ' + (err.response?.data?.detail || err.message));
      setTriggering(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Completed
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> {status.toUpperCase()}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-slate-400">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-sm">Loading project information...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Link to="/projects" className="inline-flex items-center text-slate-400 hover:text-slate-200">
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Projects
        </Link>
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          {error || 'Project not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link to="/projects" className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-slate-100">{project.name}</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                {project.source_type}
              </span>
            </div>
            {project.description && (
              <p className="text-slate-400 text-sm mt-1">{project.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition-colors"
            title="Refresh Scans"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleTriggerScan}
            disabled={triggering}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg flex items-center font-medium transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {triggering ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Queuing Scan...</>
            ) : (
              <><Play className="w-4 h-4 mr-2 fill-current" /> Trigger Security Scan</>
            )}
          </button>
        </div>
      </div>

      {/* Project Meta Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Source Origin</p>
          <p className="text-sm font-semibold text-slate-200 mt-1 truncate">
            {project.source_url || 'Uploaded archive context'}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Created Date</p>
          <p className="text-sm font-semibold text-slate-200 mt-1">
            {new Date(project.created_at).toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Scans Executed</p>
          <p className="text-sm font-semibold text-blue-400 mt-1 font-mono text-base">
            {scans.length} Scans
          </p>
        </div>
      </div>

      {/* Scan History Section */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-200">Execution & Scan History</h2>
          <span className="text-xs text-slate-500">{scans.length} historical run(s)</span>
        </div>

        {scans.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
            <Shield className="mx-auto h-12 w-12 text-slate-700 mb-3" />
            <h3 className="text-base font-medium text-slate-300">No scans executed yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Launch the automated vulnerability and runtime sandboxing pipeline for this project.
            </p>
            <button
              onClick={handleTriggerScan}
              disabled={triggering}
              className="mt-5 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-500 transition-colors"
            >
              <Play className="w-4 h-4 mr-2 fill-current" /> Trigger First Scan
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-950/40">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Scan ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Pipeline Progress</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Started</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-slate-900 divide-y divide-slate-800/60">
                {scans.map((scan) => (
                  <tr 
                    key={scan.id}
                    onClick={() => navigate(`/scans/${scan.id}`)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs text-blue-400 group-hover:underline">
                        {scan.id.substring(0, 13)}...
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(scan.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-36 bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${scan.status === 'completed' ? 'bg-emerald-500' : scan.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'}`} 
                          style={{ width: `${scan.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 mt-1 inline-block">{scan.progress || 0}%</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                      {new Date(scan.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(scan.started_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <span className="text-blue-400 font-medium text-xs flex items-center justify-end group-hover:translate-x-1 transition-transform">
                        {scan.status === 'completed' ? 'View Findings' : 'Watch Live'} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
