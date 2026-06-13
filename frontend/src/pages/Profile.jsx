import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { User, Mail, Lock, CheckCircle, AlertCircle, Save } from 'lucide-react';

function Profile() {
  const { user, updateProfile } = useAuth();
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  // Hook Form for profile details
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors }
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || ''
    }
  });

  // Hook Form for password change
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors }
  } = useForm();

  // 1. Submit Profile details update
  const onProfileSubmit = async (data) => {
    setProfileSuccess('');
    setProfileError('');
    setSubmittingProfile(true);
    try {
      const response = await api.put('/users/profile', {
        name: data.name,
        email: data.email
      });
      
      updateProfile({ name: data.name, email: data.email });
      setProfileSuccess(response.data.message || 'Profile updated successfully.');
    } catch (error) {
      console.error(error);
      setProfileError(error.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSubmittingProfile(false);
    }
  };

  // 2. Submit Password change
  const onPasswordSubmit = async (data) => {
    setPasswordSuccess('');
    setPasswordError('');
    setSubmittingPassword(true);
    try {
      const response = await api.put('/users/profile', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      setPasswordSuccess(response.data.message || 'Password changed successfully.');
      resetPasswordForm();
    } catch (error) {
      console.error(error);
      setPasswordError(error.response?.data?.message || 'Incorrect current password or update failed.');
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 bg-slate-50 dark:bg-dark-950 overflow-y-auto h-[calc(100vh-4rem)]">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Account Settings</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage your details, roles, and credentials.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 items-start">
        
        {/* Left Column: Profile details Form */}
        <div className="glass-card p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-brand-600" />
              Personal Details
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Edit your name or email. Updates will sync automatically.</p>
          </div>

          <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
            
            {/* Status Feedback */}
            {profileSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-250/20">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {profileSuccess}
              </div>
            )}

            {profileError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-250/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {profileError}
              </div>
            )}

            {/* Name Input */}
            <div className="space-y-1">
              <label htmlFor="name" className="text-xs font-semibold text-slate-700 dark:text-slate-355">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="name"
                  type="text"
                  placeholder="Gagan"
                  className={`w-full rounded-xl border pl-9 pr-4 py-2 text-sm bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                    profileErrors.name ? 'border-rose-500' : ''
                  }`}
                  {...registerProfile('name', { required: 'Name is required' })}
                />
              </div>
              {profileErrors.name && (
                <p className="text-[10px] text-rose-500 font-medium">{profileErrors.name.message}</p>
              )}
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-355">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className={`w-full rounded-xl border pl-9 pr-4 py-2 text-sm bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                    profileErrors.email ? 'border-rose-500' : ''
                  }`}
                  {...registerProfile('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^\S+@\S+$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
              </div>
              {profileErrors.email && (
                <p className="text-[10px] text-rose-500 font-medium">{profileErrors.email.message}</p>
              )}
            </div>

            {/* Account Role Readonly Info */}
            <div className="p-3 bg-slate-100/60 dark:bg-dark-950/40 rounded-xl border border-slate-250/20 text-xs text-slate-550 dark:text-slate-400">
              <p className="font-semibold text-slate-750 dark:text-slate-300 capitalize">Account Level: {user?.role}</p>
              <p className="mt-1 text-[10px] text-slate-400">Registered on {user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</p>
            </div>

            <button
              type="submit"
              disabled={submittingProfile}
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-500 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {submittingProfile ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>

          </form>
        </div>

        {/* Right Column: Password change Form */}
        <div className="glass-card p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Lock className="h-4.5 w-4.5 text-indigo-600" />
              Security Settings
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Update your password security access credentials.</p>
          </div>

          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            
            {/* Status Feedback */}
            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-250/20">
                <CheckCircle className="h-4 w-4 shrink-0" />
                {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-250/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {passwordError}
              </div>
            )}

            {/* Current Password Input */}
            <div className="space-y-1">
              <label htmlFor="currentPassword" className="text-xs font-semibold text-slate-700 dark:text-slate-355">
                Current Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  className={`w-full rounded-xl border pl-9 pr-4 py-2 text-sm bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                    passwordErrors.currentPassword ? 'border-rose-500' : ''
                  }`}
                  {...registerPassword('currentPassword', { required: 'Current password is required' })}
                />
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-[10px] text-rose-500 font-medium">{passwordErrors.currentPassword.message}</p>
              )}
            </div>

            {/* New Password Input */}
            <div className="space-y-1">
              <label htmlFor="newPassword" className="text-xs font-semibold text-slate-700 dark:text-slate-355">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  className={`w-full rounded-xl border pl-9 pr-4 py-2 text-sm bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all ${
                    passwordErrors.newPassword ? 'border-rose-500' : ''
                  }`}
                  {...registerPassword('newPassword', { 
                    required: 'New password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                />
              </div>
              {passwordErrors.newPassword && (
                <p className="text-[10px] text-rose-500 font-medium">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submittingPassword}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-650 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-600 bg-indigo-600 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {submittingPassword ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Change Password
                </>
              )}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}

export default Profile;
