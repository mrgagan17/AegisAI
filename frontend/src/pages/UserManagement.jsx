import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, 
  Search, 
  UserMinus, 
  ShieldAlert, 
  CheckCircle2, 
  Trash2, 
  Loader2,
  Mail
} from 'lucide-react';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [submittingId, setSubmittingId] = useState(null); // Tracks user ID during actions

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Toggle user suspension
  const handleToggleSuspend = async (userId) => {
    setSubmittingId(userId);
    try {
      const response = await api.put(`/admin/user/${userId}/suspend`);
      
      // Update state locally
      setUsers((prev) => 
        prev.map((u) => u._id === userId ? { ...u, isSuspended: response.data.user.isSuspended } : u)
      );
    } catch (error) {
      console.error('Failed to suspend user:', error);
      alert(error.response?.data?.message || 'Action failed.');
    } finally {
      setSubmittingId(null);
    }
  };

  // Delete user (cascade delete)
  const handleDeleteUser = async (userId) => {
    const confirmDelete = window.confirm(
      'WARNING: This will permanently delete this user, all their uploaded documents, all text vectors, and their chat history. This action CANNOT be undone. Proceed?'
    );

    if (!confirmDelete) return;

    setSubmittingId(userId);
    try {
      await api.delete(`/admin/user/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.message || 'Delete user failed.');
    } finally {
      setSubmittingId(null);
    }
  };

  // Search filter
  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 bg-slate-50 dark:bg-dark-950 overflow-y-auto h-[calc(100vh-4rem)]">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="h-5.5 w-5.5 text-brand-600" />
            User Account Controls
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Suspend, activate, or cascade-delete registered company users.</p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-450 dark:text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border pl-9 pr-4 py-2.5 text-xs bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-800 text-slate-800 dark:text-slate-200 placeholder-slate-450 focus:outline-none focus:border-brand-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading user registry database...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-xs text-slate-450 dark:text-slate-500">
            No registered users match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-650 dark:text-slate-400">
              <thead>
                <tr className="bg-slate-100/50 dark:bg-dark-900/40 border-b border-slate-200/55 dark:border-dark-800/40 text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Account Type</th>
                  <th className="px-6 py-4">Creation Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-850">
                {filteredUsers.map((u) => (
                  <tr 
                    key={u._id} 
                    className={`hover:bg-slate-50/30 dark:hover:bg-dark-900/10 transition-colors ${
                      u.isSuspended ? 'bg-rose-50/10 dark:bg-rose-950/5' : ''
                    }`}
                  >
                    {/* User profile name */}
                    <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                      {u.name}
                      {u.isSuspended && (
                        <span className="ml-2 inline-flex items-center rounded-md bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 text-[9px] font-bold text-rose-650 dark:text-rose-455 border border-rose-100/40 dark:border-rose-900/20">
                          Suspended
                        </span>
                      )}
                    </td>
                    
                    {/* Email */}
                    <td className="px-6 py-4 flex items-center gap-1.5 py-4">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      {u.email}
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4 capitalize font-medium">
                      {u.role === 'admin' ? (
                        <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Admin
                        </span>
                      ) : (
                        u.role
                      )}
                    </td>

                    {/* Creation date */}
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    {/* Action buttons */}
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-3.5">
                      {/* Suspend Account toggle */}
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleSuspend(u._id)}
                          disabled={submittingId !== null}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-[10px] font-semibold transition-all ${
                            u.isSuspended
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30'
                              : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/50 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30'
                          }`}
                          title={u.isSuspended ? 'Re-activate Account' : 'Suspend Account'}
                        >
                          {submittingId === u._id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : u.isSuspended ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Activate
                            </>
                          ) : (
                            <>
                              <UserMinus className="h-3 w-3" />
                              Suspend
                            </>
                          )}
                        </button>
                      )}

                      {/* Delete account cascade */}
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          disabled={submittingId !== null}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Cascade Delete Account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
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

export default UserManagement;
