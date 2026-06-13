import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, LogOut, ShieldAlert, Cpu, User } from 'lucide-react';

function Navbar() {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b transition-all duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-300">
                <Cpu className="h-5.5 w-5.5" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                AegisAI
              </span>
            </Link>
            
            {/* Public Links */}
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              <Link to="/" className="text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 transition-colors">
                Home
              </Link>
              <Link to="/about" className="text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 transition-colors">
                About
              </Link>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-dark-800 dark:bg-dark-900 dark:text-slate-300 dark:hover:bg-dark-800 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-brand-600" />}
            </button>

            {user ? (
              <div className="flex items-center space-x-2 md:space-x-3">
                {/* Admin Indicator */}
                {user.role === 'admin' && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 animate-pulse-subtle">
                    <ShieldAlert className="h-3 w-3" />
                    Admin
                  </span>
                )}

                {/* Dashboard Link */}
                <Link
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  className="hidden sm:inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 shadow-sm transition-all duration-200 active:scale-[0.98]"
                >
                  Dashboard
                </Link>

                {/* Profile Link */}
                <Link
                  to="/profile"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 dark:border-dark-800 dark:bg-dark-950 dark:text-slate-200 hover:scale-[1.03] transition-all duration-200"
                  title="View Profile"
                >
                  <User className="h-4 w-4" />
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 dark:border-dark-800 dark:bg-dark-900 dark:hover:bg-dark-850 hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-dark-850 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500 shadow-sm transition-all active:scale-[0.98]"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
