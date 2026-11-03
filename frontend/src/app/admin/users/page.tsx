'use client';

import React, { useState, useEffect } from 'react';
import { User, Role } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { formatDateTime } from '@/lib/formatters';
import { Users, Plus, X, UserCheck, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('staff');
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiRequest<User[]>('/users');
      setUsers(data || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to load user accounts.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setIsSaving(true);

    try {
      await apiRequest<User>('/users', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('staff');
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setModalError(err.message);
      } else {
        setModalError('Failed to create user account.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      await apiRequest<User>(`/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          is_active: !user.is_active,
        }),
      });
      fetchUsers();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center">
            <Users className="h-6 w-6 mr-2 text-emerald-400 shrink-0" />
            <span>User & Cashier Management</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Manage staff accounts, assign administrative roles, and activate or deactivate system logins.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setModalError(null);
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          <span>Add User</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center">
          <AlertCircle className="h-5 w-5 mr-2 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content: Table on Desktop, Card List on Mobile */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Mobile Card List (< md: 768px) per Constraint #14 */}
            <div className="block md:hidden divide-y divide-slate-800/80 p-3 space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="bg-slate-850/60 border border-slate-800 rounded-xl p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-white">{u.name}</h4>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{u.email}</div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/60'
                          : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                      }`}
                    >
                      {u.role === 'admin' ? (
                        <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                      ) : (
                        <UserCheck className="h-3.5 w-3.5 mr-1" />
                      )}
                      {u.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500">Account Status:</span>
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                        u.is_active ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 tabular-nums">
                    Created: {formatDateTime(u.created_at)}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(u)}
                    className={`w-full flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      u.is_active
                        ? 'bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-400 border border-slate-700/80'
                        : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/80'
                    }`}
                  >
                    {u.is_active ? 'Deactivate Account' : 'Activate Account'}
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md: 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email Address</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date Created</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-bold text-white">{u.name}</td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-xs">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/60'
                              : 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/60'
                          }`}
                        >
                          {u.role === 'admin' ? (
                            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5 mr-1" />
                          )}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold ${
                            u.is_active
                              ? 'bg-emerald-950 text-emerald-400'
                              : 'bg-rose-950 text-rose-400'
                          }`}
                        >
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 tabular-nums">
                        {formatDateTime(u.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`flex items-center justify-center min-h-[44px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition mx-auto cursor-pointer ${
                            u.is_active
                              ? 'bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400'
                              : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Create User Modal (Responsive Fullscreen on Mobile) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          {/* Desktop Backdrop */}
          <div
            className="fixed inset-0 hidden sm:block bg-transparent"
            onClick={() => setIsModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 bg-slate-900 border-0 sm:border border-slate-800 rounded-none sm:rounded-2xl w-full min-h-screen sm:min-h-0 sm:max-w-md flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Sticky Header */}
            <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-white">Create New User</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close Dialog"
                className="flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleCreateUser} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {modalError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs sm:text-sm">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  inputMode="email"
                  autoComplete="email"
                  placeholder="cashier@posv1.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Role & Permissions
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full px-3.5 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[48px] cursor-pointer"
                >
                  <option value="staff">Staff (Cashier - Sales & Checkout Only)</option>
                  <option value="admin">Admin (Owner - Full System Access)</option>
                </select>
              </div>

              {/* Sticky Actions in Modal Footer */}
              <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md pt-4 pb-2 border-t border-slate-800 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="flex-1 min-h-[48px] py-3 px-4 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 min-h-[48px] py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white text-sm font-bold flex items-center justify-center transition cursor-pointer shadow-lg shadow-emerald-600/30"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Create User</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
