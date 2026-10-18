import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldAlert,
  Users,
  FileText,
  AlertTriangle,
  Activity,
  CheckCircle,
  XCircle,
  Trash2,
  Search,
  UserPlus,
  Plus,
  Shield,
  Key,
} from 'lucide-react';
import { api } from '../api/client';
import { PlatformMetrics, Report, User } from '../types';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';

export const AdminPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'audit'>('reports');
  const [userSearch, setUserSearch] = useState('');

  // Create User Modal State
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'moderator' | 'admin'>('user');
  const [newIsVerified, setNewIsVerified] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // 1. Fetch Metrics
  const { data: metrics } = useQuery<PlatformMetrics>({
    queryKey: ['admin-metrics'],
    queryFn: async () => {
      const res = await api.get('/admin/metrics');
      return res.data.data;
    },
  });

  // 2. Fetch Reports
  const { data: reports = [], refetch: refetchReports } = useQuery<Report[]>({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const res = await api.get('/admin/reports?status=pending');
      return res.data.data;
    },
    enabled: activeTab === 'reports',
  });

  // 3. Fetch Users
  const { data: users = [], refetch: refetchUsers } = useQuery<User[]>({
    queryKey: ['admin-users', userSearch],
    queryFn: async () => {
      const res = await api.get(`/admin/users?search=${encodeURIComponent(userSearch)}`);
      return res.data.data;
    },
    enabled: activeTab === 'users',
  });

  // 4. Fetch Audit Logs
  const { data: auditLogs = [] } = useQuery<any[]>({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs');
      return res.data.data;
    },
    enabled: activeTab === 'audit',
  });

  const resolveReportMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: 'resolved' | 'dismissed' }) => {
      await api.patch(`/admin/reports/${reportId}`, {
        status,
        resolutionNotes: `Action taken by admin @${currentUser?.username}`,
      });
    },
    onSuccess: () => {
      refetchReports();
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status, role }: { userId: string; status?: string; role?: string }) => {
      await api.patch(`/admin/users/${userId}/status`, { status, role });
    },
    onSuccess: () => {
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      setCreateError(null);
      const res = await api.post('/admin/users/create', {
        username: newUsername,
        email: newEmail,
        displayName: newDisplayName,
        password: newPassword,
        role: newRole,
        isVerified: newIsVerified,
      });
      return res.data;
    },
    onSuccess: () => {
      setIsCreateUserOpen(false);
      setNewUsername('');
      setNewEmail('');
      setNewDisplayName('');
      setNewPassword('');
      setNewRole('user');
      setNewIsVerified(false);
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
    onError: (err: any) => {
      setCreateError(err.response?.data?.message || 'Failed to create user account');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-purple-600/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Admin & Moderation Console
            </h2>
            <p className="text-xs text-slate-400">
              Platform telemetry, moderation queue, user rights management, and audit logs.
            </p>
          </div>
        </div>

        {activeTab === 'users' && (
          <Button
            size="sm"
            onClick={() => setIsCreateUserOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="!bg-purple-600 hover:!bg-purple-700 shadow-sm shadow-purple-500/20"
          >
            Create Account
          </Button>
        )}
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Users</span>
              <Users className="w-4 h-4 text-brand-500" />
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-slate-100">{metrics.totalUsers}</p>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">+{metrics.newUsersThisWeek} this week</p>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Total Posts</span>
              <FileText className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-xl font-black text-slate-900 dark:text-slate-100">{metrics.totalPosts}</p>
            <p className="text-[10px] text-indigo-500 font-bold mt-1">+{metrics.newPostsThisWeek} this week</p>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Pending Reports</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400">{metrics.pendingReports}</p>
            <p className="text-[10px] text-slate-400 mt-1">Requires review</p>
          </div>

          <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Active Accounts</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{metrics.activeUsers}</p>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">Normal standing</p>
          </div>
        </div>
      )}

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-200/80 dark:border-slate-800/80">
        <button
          onClick={() => setActiveTab('reports')}
          className={`py-3 px-4 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'reports'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Moderation Queue ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-3 px-4 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'users'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          User Accounts
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 text-xs font-bold transition-colors border-b-2 ${
            activeTab === 'audit'
              ? 'border-brand-500 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Audit Logs
        </button>
      </div>

      {/* Tab 1: Moderation Queue */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              All reports have been reviewed! Moderation queue is empty.
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report._id}
                className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                      {report.reason}
                    </span>
                    <span className="text-xs text-slate-400">Target Type: {report.targetType}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Reported by @{report.reporter?.username}
                  </span>
                </div>

                {report.details && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl italic">
                    "{report.details}"
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      resolveReportMutation.mutate({ reportId: report._id, status: 'dismissed' })
                    }
                  >
                    Dismiss Report
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() =>
                      resolveReportMutation.mutate({ reportId: report._id, status: 'resolved' })
                    }
                  >
                    Resolve & Enforce
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: User Accounts Management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user accounts by username or email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <Button
              size="sm"
              onClick={() => setIsCreateUserOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="!bg-purple-600 hover:!bg-purple-700"
            >
              Add User
            </Button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
            {users.map((u) => (
              <div key={u._id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar src={u.avatar} alt={u.displayName} size="sm" isVerified={u.isVerified} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{u.displayName}</p>
                      {u.isVerified && (
                        <span className="text-[10px] text-brand-500 font-bold">✓ Verified</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">@{u.username} • {u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  {/* Role Selector */}
                  <select
                    value={u.role}
                    onChange={(e) =>
                      updateUserStatusMutation.mutate({ userId: u._id, role: e.target.value })
                    }
                    className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-purple-500 cursor-pointer font-semibold uppercase tracking-wider"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>

                  {/* Suspend / Restore */}
                  {u.status === 'active' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="!text-amber-500 !border-amber-500/30 !py-1 !px-2.5 !text-xs"
                      onClick={() =>
                        updateUserStatusMutation.mutate({ userId: u._id, status: 'suspended' })
                      }
                    >
                      Suspend
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      className="!py-1 !px-2.5 !text-xs"
                      onClick={() =>
                        updateUserStatusMutation.mutate({ userId: u._id, status: 'active' })
                      }
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div
              key={log._id}
              className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 text-xs flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 mr-2">
                  {log.action}
                </span>
                <span className="text-slate-400">Target: {log.targetType}</span>
                {log.actor && (
                  <span className="text-[10px] text-purple-500 ml-2 font-semibold">
                    by @{log.actor.username}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400">
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Create User Account Modal (Admin Controlled) */}
      {isCreateUserOpen && (
        <Modal
          isOpen={isCreateUserOpen}
          onClose={() => setIsCreateUserOpen(false)}
          title="Create New User Account (Admin)"
          maxWidth="md"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-3.5">
            <Input
              label="Username"
              placeholder="e.g. jessica_dev"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              required
            />

            <Input
              label="Display Name"
              placeholder="Jessica Miller"
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="jessica@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />

            <Input
              label="Initial Password"
              type="password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Account Role (Admin Decides)
              </label>
              <select
                value={newRole}
                onChange={(e: any) => setNewRole(e.target.value)}
                className="w-full rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-purple-500"
              >
                <option value="user">Standard User</option>
                <option value="moderator">Content Moderator</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800/60">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Verified Badge</p>
                <p className="text-[11px] text-slate-400">Award official verified creator checkmark</p>
              </div>
              <input
                type="checkbox"
                checked={newIsVerified}
                onChange={(e) => setNewIsVerified(e.target.checked)}
                className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
              />
            </div>

            {createError && (
              <p className="text-xs text-rose-500 font-medium">{createError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsCreateUserOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={createUserMutation.isPending}
                className="!bg-purple-600 hover:!bg-purple-700"
              >
                Create Account
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
