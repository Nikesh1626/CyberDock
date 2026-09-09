import React from 'react';
import { ShieldAlert, Activity, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function Dashboard() {
  // Placeholder data
  const stats = [
    { name: 'Total Projects', value: 12, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { name: 'Scans Passed', value: 45, icon: ShieldCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
    { name: 'Critical Issues', value: 3, icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-500/10' },
    { name: 'Completed Scans', value: 89, icon: CheckCircle2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  const severityData = [
    { name: 'Critical', value: 3, color: '#ef4444' },
    { name: 'High', value: 12, color: '#f97316' },
    { name: 'Medium', value: 24, color: '#eab308' },
    { name: 'Low', value: 45, color: '#3b82f6' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center shadow-sm">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} mr-4`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">{stat.name}</p>
              <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-1 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Vulnerability Severity</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {severityData.map(item => (
              <div key={item.name} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-slate-400">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Scans */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 lg:col-span-2 shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Recent Scans</h2>
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-lg bg-slate-900/50">
            <div className="text-center">
              <Activity className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <p className="text-slate-400">Run a scan to see recent activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
