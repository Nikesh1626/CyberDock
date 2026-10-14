import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, GitBranch, FileBox, Loader2, ArrowRight, Trash2, Calendar, Shield } from 'lucide-react';
import api from '../lib/api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects/');
      setProjects(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, projectId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this project and all its scan data?')) return;

    try {
      setDeletingId(projectId);
      await api.delete(`/projects/${projectId}`);
      setProjects(projects.filter(p => p.id !== projectId));
    } catch (err) {
      alert('Failed to delete project: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const getSourceIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'github': return <GitBranch className="w-5 h-5 text-blue-400" />;
      case 'zip': return <FileBox className="w-5 h-5 text-emerald-400" />;
      default: return <FolderKanban className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Projects</h1>
          <p className="text-slate-400 text-sm mt-1">Manage containerized applications and triggered security scans</p>
        </div>
        <Link 
          to="/projects/new" 
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg flex items-center font-medium transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Project
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          Failed to load projects: {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col justify-center items-center py-24 text-slate-400">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
          <p className="text-sm">Loading projects from CyberDock API...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-xl">
          <FolderKanban className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-medium text-slate-200">No projects yet</h3>
          <p className="mt-1 text-slate-400 text-sm">Create a new project to start automated container vulnerability scanning.</p>
          <div className="mt-6">
            <Link to="/projects/new" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-500">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-850 bg-slate-950/40">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Project Name</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Source Type</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Created Date</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-800/60">
              {projects.map((project) => (
                <tr 
                  key={project.id} 
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-slate-950 rounded-lg flex items-center justify-center border border-slate-800 group-hover:border-blue-500/50 transition-colors">
                        {getSourceIcon(project.source_type)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{project.name}</div>
                        {project.description && (
                          <div className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">{project.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                      {project.source_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5 text-slate-500" />
                      {new Date(project.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-3">
                      <button
                        onClick={(e) => handleDelete(e, project.id)}
                        disabled={deletingId === project.id}
                        className="text-slate-500 hover:text-red-400 p-1.5 rounded-md hover:bg-slate-800 transition-colors"
                        title="Delete Project"
                      >
                        {deletingId === project.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                      <span className="text-blue-400 font-medium text-xs flex items-center group-hover:translate-x-1 transition-transform">
                        Details <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
