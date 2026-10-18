import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { ReelsPage } from './pages/ReelsPage';
import { MessagesPage } from './pages/MessagesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

/** Shown only when there is NO cached user and the backend is cold-starting */
const WakingScreen: React.FC<{ waking: boolean }> = ({ waking }) => (
  <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-white gap-6">
    {/* Logo */}
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-black tracking-tight">SocialSphere</h1>
        <p className="text-xs text-slate-400">PLATFORM V1.0</p>
      </div>
    </div>

    {/* Status */}
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-violet-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <span className="text-sm text-slate-300">
          {waking ? 'Waking up server, please wait…' : 'Connecting…'}
        </span>
      </div>
      {waking && (
        <p className="text-xs text-slate-500 max-w-xs text-center">
          The server is starting up. This takes about 10–15 seconds on first load. Thank you for your patience!
        </p>
      )}
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, isLoading, serverWaking } = useAuth();

  if (isLoading) {
    return <WakingScreen waking={serverWaking} />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const hasAccess = user?.role === 'admin' || user?.role === 'moderator';
  return hasAccess ? children : <Navigate to="/" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected App Routes inside Master Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="reels" element={<ReelsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile/:username" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route
            path="admin"
            element={
              <AdminRoute>
                <AdminPage />
              </AdminRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
