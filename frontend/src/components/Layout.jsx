import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, FolderKanban, LogOut, Shield } from 'lucide-react';

const Layout = () => {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Shield className="w-8 h-8 text-blue-500 mr-3" />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">CyberDock</span>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="px-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive 
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold text-slate-300 border border-slate-700">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="ml-3 truncate">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center px-4 py-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 sticky top-0 z-10">
          <h1 className="text-xl font-semibold text-slate-200">
            {navItems.find(item => item.path === location.pathname)?.name || 'CyberDock'}
          </h1>
          <div className="flex items-center gap-4">
            {/* Header actions can go here */}
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
