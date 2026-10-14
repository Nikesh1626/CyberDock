import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Activity, CheckCircle2, ShieldCheck, ArrowRight, Loader2, Play } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../lib/api';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/metrics/summary');
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { name: 'Total Projects', value: metrics?.total_projects ?? 0, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Completed Scans', value: metrics?.completed_scans ?? 0, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { name: 'Critical Vulnerabilities', value: metrics?.critical_issues ?? 0, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10' },
    { name: 'Total Pipelines Run', value: metrics?.total_scans ?? 0, icon: ShieldCheck, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  const severityData = metrics?.severity_breakdown || [
    { name: 'Critical', value: 0, color: '#ef4444' },
    { name: 'High', value: 0, color: '#f97316' },
    { name: 'Medium', value: 0, color: '#eab308' },
    { name: 'Low', value: 0, color: '#3b82f6' },
  ];

  const hasSeverityData = severityData.some(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">CyberDock Security Command Center</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time container vulnerability analysis & runtime sandbox telemetry</p>
        </div>
        <Link
          to="/projects/new"
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
        >
          + Create New Project
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center shadow-sm">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} mr-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-100 mt-0.5">
                {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-500 inline" /> : stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Breakdown Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-1 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-200 mb-1">Global Vulnerability Severity</h2>
            <p className="text-xs text-slate-500 mb-4">Aggregated across all repository scans</p>
          </div>

          <div className="h-[240px] flex items-center justify-center">
            {hasSeverityData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData.filter(d => d.value > 0)}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#f1f5f9' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500 text-sm">
                No vulnerabilities logged yet.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800">
            {severityData.map(item => (
              <div key={item.name} className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-slate-400">{item.name}: <strong className="text-slate-200">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Scans Activity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-base font-semibold text-slate-200">Recent Pipeline Executions</h2>
              <p className="text-xs text-slate-500">Latest automated security scans</p>
            </div>
            <Link to="/projects" className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center">
              View All Projects <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {metrics?.recent_scans?.length > 0 ? (
            <div className="divide-y divide-slate-800/60 overflow-hidden">
              {metrics.recent_scans.map((scan) => (
                <div 
                  key={scan.id} 
                  onClick={() => navigate(`/scans/${scan.id}`)}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-800/40 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-mono text-xs">
                      #{scan.id.substring(0, 4)}
                    </div>
                    <div>
                      <p className="text-xs font-mono text-slate-300 font-semibold">{scan.id}</p>
                      <p className="text-2xs text-slate-500">
                        {scan.started_at ? new Date(scan.started_at).toLocaleString() : 'Recently'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      scan.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      scan.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {scan.status}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/40 py-12">
              <div className="text-center">
                <Activity className="mx-auto h-10 w-10 text-slate-600 mb-2" />
                <p className="text-slate-400 text-sm">No scans run yet.</p>
                <Link to="/projects/new" className="mt-3 inline-flex items-center text-xs text-blue-400 hover:text-blue-300">
                  <Play className="w-3.5 h-3.5 mr-1 fill-current" /> Trigger your first pipeline run
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
