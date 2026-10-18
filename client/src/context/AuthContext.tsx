import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  serverWaking: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Returns cached user from localStorage synchronously — instant load. */
function getCachedUser(): User | null {
  try {
    const saved = localStorage.getItem('socialsphere_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getCachedUser);
  // If we have a cached user, don't show the loading spinner at all
  const [isLoading, setIsLoading] = useState<boolean>(!getCachedUser());
  const [serverWaking, setServerWaking] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('socialsphere_access_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    // Show "waking server" message only if there is no cached user
    const wakingTimer = setTimeout(() => {
      if (!cancelled && !getCachedUser()) setServerWaking(true);
    }, 2000);

    const controller = new AbortController();

    // 12-second timeout — covers Render cold start (usually ~8s)
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    api
      .get('/auth/me', { signal: controller.signal })
      .then((response) => {
        clearTimeout(timeoutId);
        if (!cancelled && response.data.success) {
          setUser(response.data.data);
          localStorage.setItem('socialsphere_user', JSON.stringify(response.data.data));
        }
      })
      .catch(() => {
        clearTimeout(timeoutId);
        // On timeout/network error: if we had a cached user keep them logged in,
        // otherwise clear tokens so login page shows
        if (!cancelled) {
          const cached = getCachedUser();
          if (!cached) {
            setUser(null);
            localStorage.removeItem('socialsphere_access_token');
            localStorage.removeItem('socialsphere_refresh_token');
            localStorage.removeItem('socialsphere_user');
          }
          // If cached user exists, we keep them — they might just be offline / cold start
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
          setServerWaking(false);
        }
      });

    const handleLogoutEvent = () => setUser(null);
    window.addEventListener('auth:logout', handleLogoutEvent);

    return () => {
      cancelled = true;
      clearTimeout(wakingTimer);
      clearTimeout(timeoutId);
      controller.abort();
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, []);

  const login = async (loginId: string, password: string) => {
    const response = await api.post('/auth/login', { login: loginId, password });
    const { user: loggedInUser, accessToken, refreshToken } = response.data.data;

    localStorage.setItem('socialsphere_access_token', accessToken);
    localStorage.setItem('socialsphere_refresh_token', refreshToken);
    localStorage.setItem('socialsphere_user', JSON.stringify(loggedInUser));

    setUser(loggedInUser);
  };

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    displayName: string;
  }) => {
    const response = await api.post('/auth/register', data);
    const { user: registeredUser, accessToken, refreshToken } = response.data.data;

    localStorage.setItem('socialsphere_access_token', accessToken);
    localStorage.setItem('socialsphere_refresh_token', refreshToken);
    localStorage.setItem('socialsphere_user', JSON.stringify(registeredUser));

    setUser(registeredUser);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('socialsphere_refresh_token');
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('socialsphere_access_token');
      localStorage.removeItem('socialsphere_refresh_token');
      localStorage.removeItem('socialsphere_user');
      setUser(null);
    }
  };

  const updateUser = (updatedFields: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updatedFields };
      localStorage.setItem('socialsphere_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        serverWaking,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
