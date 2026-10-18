import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Compass, PlusSquare, Film, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  onOpenCreatePost: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenCreatePost }) => {
  const { user } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 px-2 py-2 flex items-center justify-around">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `p-2.5 rounded-xl transition-colors ${
            isActive ? 'text-brand-500 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <Home className="w-6 h-6" />
      </NavLink>

      <NavLink
        to="/explore"
        className={({ isActive }) =>
          `p-2.5 rounded-xl transition-colors ${
            isActive ? 'text-brand-500 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <Compass className="w-6 h-6" />
      </NavLink>

      {/* Floating Create Button */}
      <button
        onClick={onOpenCreatePost}
        className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/30 active:scale-95 transition-transform"
      >
        <PlusSquare className="w-6 h-6" />
      </button>

      <NavLink
        to="/reels"
        className={({ isActive }) =>
          `p-2.5 rounded-xl transition-colors ${
            isActive ? 'text-brand-500 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <Film className="w-6 h-6" />
      </NavLink>

      <NavLink
        to={`/profile/${user?.username || 'me'}`}
        className={({ isActive }) =>
          `p-2.5 rounded-xl transition-colors ${
            isActive ? 'text-brand-500 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`
        }
      >
        <User className="w-6 h-6" />
      </NavLink>
    </nav>
  );
};
