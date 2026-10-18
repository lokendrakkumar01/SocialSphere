import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  Compass,
  Film,
  MessageSquare,
  Bell,
  User as UserIcon,
  Settings,
  ShieldAlert,
  PlusSquare,
  Moon,
  Sun,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../common/Avatar';

interface SidebarProps {
  onOpenCreatePost: () => void;
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenCreatePost,
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Explore', icon: Compass, path: '/explore' },
    { label: 'Reels', icon: Film, path: '/reels' },
    {
      label: 'Messages',
      icon: MessageSquare,
      path: '/messages',
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
    },
    {
      label: 'Notifications',
      icon: Bell,
      path: '/notifications',
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined,
    },
    { label: 'Profile', icon: UserIcon, path: `/profile/${user?.username || 'me'}` },
  ];

  if (user?.role === 'admin' || user?.role === 'moderator') {
    navItems.push({ label: 'Admin', icon: ShieldAlert, path: '/admin' });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0b0f19] px-4 py-6 justify-between select-none z-30">
      <div className="space-y-6">
        {/* Brand Logo */}
        <NavLink to="/" className="flex items-center gap-3 px-3 py-1 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
              SocialSphere
            </h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
              Platform v1.0
            </p>
          </div>
        </NavLink>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 font-bold'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
                }`
              }
            >
              <div className="flex items-center gap-3.5">
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </NavLink>
          ))}

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400 font-bold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/50'
              }`
            }
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* Create Post Button */}
        <button
          onClick={onOpenCreatePost}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-sm shadow-md shadow-brand-500/25 active:scale-[0.98] transition-all"
        >
          <PlusSquare className="w-5 h-5" />
          <span>Create Post</span>
        </button>
      </div>

      {/* Footer controls: theme toggle & user pill */}
      <div className="space-y-3 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
        >
          <span className="flex items-center gap-2.5">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-brand-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            Toggle
          </span>
        </button>

        {user && (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50 dark:bg-[#111827] border border-slate-200/50 dark:border-slate-800/50">
            <NavLink
              to={`/profile/${user.username}`}
              className="flex items-center gap-2.5 overflow-hidden flex-1 group"
            >
              <Avatar src={user.avatar} alt={user.displayName} size="sm" isVerified={user.isVerified} />
              <div className="truncate">
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate group-hover:text-brand-500 transition-colors">
                  {user.displayName}
                </p>
                <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
              </div>
            </NavLink>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
