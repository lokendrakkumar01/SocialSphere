import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('socialsphere_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = localStorage.getItem('socialsphere_access_token');
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.data);
          localStorage.setItem('socialsphere_user', JSON.stringify(response.data.data));
        }
      } catch {
        setUser(null);
        localStorage.removeItem('socialsphere_access_token');
        localStorage.removeItem('socialsphere_refresh_token');
        localStorage.removeItem('socialsphere_user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();

    const handleLogoutEvent = () => {
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  const login = async (loginId: string, password: string) => {
    const response = await api.post('/auth/login', { login: loginId, password });
    const { user: loggedInUser, accessToken, refreshToken } = response.data.data;

    localStorage.setItem('socialsphere_access_token', accessToken);
    localStorage.setItem('socialsphere_refresh_token', refreshToken);
    localStorage.setItem('socialsphere_user', JSON.stringify(loggedInUser));

    setUser(loggedInUser);
  };

  const register = async (data: { username: string; email: string; password: string; displayName: string }) => {
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
