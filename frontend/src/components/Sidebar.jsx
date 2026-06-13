import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  MessageSquare, 
  History, 
  User, 
  Shield, 
  Users, 
  FileText, 
  LogOut, 
  ChevronRight, 
  Bot 
} from 'lucide-react';

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const linkClass = ({ isActive }) => {
    const base = "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden ";
    const active = "bg-brand-50 text-brand-600 dark:bg-brand-950/40 dark:text-brand-400 border-l-4 border-brand-500 shadow-sm ";
    const inactive = "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-dark-900 border-l-4 border-transparent ";
    return base + (isActive ? active : inactive);
  };

  if (!user) return null;

  return (
    <aside className="w-64 glass-panel border-r h-[calc(100vh-4rem)] flex flex-col justify-between p-4 sticky top-16">
      <div className="flex flex-col space-y-6">
        
        {/* User context card */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-100/60 dark:bg-dark-950/40 border border-slate-200/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-500 text-white font-bold text-base shadow-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-100">{user.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize truncate">{user.role} Account</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col space-y-1.5">
          {user.role === 'admin' ? (
            /* Admin Panels */
            <>
              <div className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                Admin Console
              </div>
              <NavLink to="/admin" end className={linkClass}>
                <Shield className="h-4.5 w-4.5" />
                <span>Overview</span>
                <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>
              <NavLink to="/admin/users" className={linkClass}>
                <Users className="h-4.5 w-4.5" />
                <span>User Management</span>
                <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>
              <NavLink to="/admin/documents" className={linkClass}>
                <FileText className="h-4.5 w-4.5" />
                <span>Doc Ownership</span>
                <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </NavLink>

              <div className="border-t border-slate-200/50 dark:border-dark-800/40 my-3"></div>
              
              <div className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                User Perspective
              </div>
            </>
          ) : null}

          {/* Standard User Panels */}
          <NavLink to="/dashboard" className={linkClass}>
            <LayoutDashboard className="h-4.5 w-4.5" />
            <span>My Documents</span>
            <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
          <NavLink to="/chat" className={linkClass}>
            <Bot className="h-4.5 w-4.5" />
            <span>AI Copilot</span>
            <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            <User className="h-4.5 w-4.5" />
            <span>My Profile</span>
            <ChevronRight className="ml-auto h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        </nav>
      </div>

      {/* Logout button in sidebar footer */}
      <div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200 active:scale-[0.98]"
        >
          <LogOut className="h-4.5 w-4.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
