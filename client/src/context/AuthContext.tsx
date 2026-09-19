import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types/index.js';
import { api, setAccessToken } from '../api/client.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session via HttpOnly refresh cookie on initial mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const data = await api.refresh();
        if (data && data.accessToken && data.user) {
          setAccessToken(data.accessToken);
          setToken(data.accessToken);
          setUser(data.user);
        }
      } catch (err) {
        // No active session in cookie; continue as logged out
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (email: string, password = 'Password123!') => {
    setIsLoading(true);
    try {
      const data = await api.login({ email, password });
      setAccessToken(data.accessToken);
      setToken(data.accessToken);
      setUser(data.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setAccessToken(null);
      setToken(null);
      setUser(null);
    }
  };

  const switchUser = async (email: string) => {
    await login(email, 'Password123!');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
