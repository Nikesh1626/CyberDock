import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { GitBranch, FileBox, UploadCloud, ArrowLeft, Loader2, Server } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://127.0.0.1:8000/api/v1';

export default function NewProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    source_type: 'github',
    source_url: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Need to send as Form Data since the FastAPI endpoint expects Form(...)
      const data = new FormData();
      data.append('name', formData.name);
      if (formData.description) data.append('description', formData.description);
      data.append('source_type', formData.source_type);
      if (formData.source_type === 'github' && formData.source_url) {
        data.append('source_url', formData.source_url);
      }
      
      await axios.post(`${API_URL}/projects/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const sourceTypes = [
    { id: 'github', title: 'GitHub Repository', icon: GitBranch, desc: 'Scan a public or private GitHub repo via URL' },
    { id: 'zip', title: 'ZIP Archive', icon: FileBox, desc: 'Upload a compressed source code archive' },
    { id: 'dockerfile', title: 'Raw Dockerfile', icon: Server, desc: 'Upload a single Dockerfile for analysis' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/projects" className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Create New Project</h1>
          <p className="text-slate-400 text-sm mt-1">Upload source code or link a repository to begin analysis</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          )}

          {/* Basic Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-200 border-b border-slate-800 pb-2">1. Project Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Project Name <span className="text-red-400">*</span></label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="block w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="e.g., e-commerce-backend"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="block w-full bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="Brief description of this application..."
              />
            </div>
          </div>

          {/* Source Type Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-200 border-b border-slate-800 pb-2">2. Source Code Origin</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sourceTypes.map((type) => (
                <div 
                  key={type.id}
                  onClick={() => setFormData({...formData, source_type: type.id})}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    formData.source_type === type.id 
                      ? 'bg-blue-600/10 border-blue-500' 
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    formData.source_type === type.id ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-900 text-slate-400'
                  }`}>
                    <type.icon className="w-5 h-5" />
                  </div>
                  <h4 className={`font-medium mb-1 ${formData.source_type === type.id ? 'text-blue-400' : 'text-slate-200'}`}>
                    {type.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{type.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Input based on Source Type */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-200 border-b border-slate-800 pb-2">3. Source Configuration</h3>
            
            {formData.source_type === 'github' ? (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">GitHub Repository URL <span className="text-red-400">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <GitBranch className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="url"
                    required
                    value={formData.source_url}
                    onChange={(e) => setFormData({...formData, source_url: e.target.value})}
                    className="block w-full pl-11 bg-slate-950 border border-slate-800 rounded-lg py-2.5 px-4 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="https://github.com/username/repo"
                  />
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-800 rounded-xl p-10 text-center hover:bg-slate-800/20 transition-colors cursor-pointer bg-slate-950">
                <UploadCloud className="mx-auto h-12 w-12 text-slate-500 mb-4" />
                <h4 className="text-sm font-medium text-slate-200 mb-1">Click to upload or drag and drop</h4>
                <p className="text-xs text-slate-500">
                  {formData.source_type === 'zip' ? 'ZIP file up to 50MB' : 'Dockerfile only'}
                </p>
                <button type="button" className="mt-4 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-700">
                  Select File
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-800/50 p-6 border-t border-slate-800 flex justify-end gap-4">
          <Link 
            to="/projects"
            className="px-6 py-2.5 rounded-lg font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating...</>
            ) : (
              'Create Project'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
