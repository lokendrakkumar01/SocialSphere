import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Moon,
  Sun,
  Shield,
  Download,
  Trash2,
  Lock,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api/client';
import { Button } from '../components/common/Button';

export const SettingsPage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [isPrivate, setIsPrivate] = useState(!!user?.isPrivate);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handlePrivacyToggle = async () => {
    setIsUpdatingPrivacy(true);
    const nextVal = !isPrivate;
    try {
      const res = await api.patch('/users/profile', { isPrivate: nextVal });
      if (res.data.success) {
        setIsPrivate(nextVal);
        updateUser({ isPrivate: nextVal });
      }
    } catch (err) {
      console.error('Failed to update privacy:', err);
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await api.get('/users/data/export');
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `socialsphere-data-${user?.username}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        'Are you sure you want to delete your account? This action is permanent and cannot be undone.'
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete('/users/data/account');
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Delete account failed:', err);
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-brand-500" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Account Settings & Privacy
        </h2>
      </div>

      <div className="space-y-4">
        {/* Appearance Settings */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-brand-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>Theme Preference</span>
          </h3>
          <p className="text-xs text-slate-400">
            Switch between light and dark visual aesthetics.
          </p>
          <div className="pt-1">
            <Button variant="outline" size="sm" onClick={toggleTheme}>
              Switch to {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-500" />
            <span>Account Privacy</span>
          </h3>
          <p className="text-xs text-slate-400">
            When your account is private, only people you approve can see your posts and stories.
          </p>
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Private Account Status: {isPrivate ? 'Enabled' : 'Disabled'}
            </span>
            <Button
              variant={isPrivate ? 'secondary' : 'primary'}
              size="sm"
              isLoading={isUpdatingPrivacy}
              onClick={handlePrivacyToggle}
            >
              {isPrivate ? 'Make Public' : 'Make Private'}
            </Button>
          </div>
        </div>

        {/* Data Portability */}
        <div className="bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Export Your Data</span>
          </h3>
          <p className="text-xs text-slate-400">
            Download an archive of your profile information, posts, and comments in portable JSON format.
          </p>
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              isLoading={isExporting}
              onClick={handleExportData}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download Data Archive
            </Button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Danger Zone</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Permanently delete your profile, media, and all social interactions from SocialSphere.
          </p>
          <div className="pt-1">
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteAccount}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
