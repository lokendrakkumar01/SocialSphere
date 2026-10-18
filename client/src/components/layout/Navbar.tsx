import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sparkles, MessageSquare, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';

interface NavbarProps {
  unreadMessagesCount?: number;
  unreadNotificationsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  unreadMessagesCount = 0,
  unreadNotificationsCount = 0,
}) => {
  const { user } = useAuth();

  return (
    <header className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-3 flex items-center justify-between">
      <NavLink to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/25">
          <Sparkles className="w-4 h-4" />
        </div>
        <span className="text-lg font-black bg-gradient-to-r from-brand-600 to-indigo-500 bg-clip-text text-transparent">
          SocialSphere
        </span>
      </NavLink>

      <div className="flex items-center gap-2">
        <NavLink
          to="/messages"
          className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadMessagesCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-500 rounded-full" />
          )}
        </NavLink>

        <NavLink
          to="/notifications"
          className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Bell className="w-5 h-5" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
          )}
        </NavLink>

        {user && (
          <NavLink to={`/profile/${user.username}`}>
            <Avatar src={user.avatar} alt={user.displayName} size="sm" isVerified={user.isVerified} />
          </NavLink>
        )}
      </div>
    </header>
  );
};
