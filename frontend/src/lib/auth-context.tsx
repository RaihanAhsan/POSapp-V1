'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from './types';
import { apiRequest } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Hydrate state from localStorage
    const savedToken = localStorage.getItem('posv1_token') || localStorage.getItem('kasirku_token');
    const savedUserStr = localStorage.getItem('posv1_user') || localStorage.getItem('kasirku_user');

    if (savedToken && savedUserStr) {
      try {
        const parsedUser: User = JSON.parse(savedUserStr);
        setToken(savedToken);
        setUser(parsedUser);
      } catch {
        localStorage.removeItem('posv1_token');
        localStorage.removeItem('posv1_user');
        localStorage.removeItem('kasirku_token');
        localStorage.removeItem('kasirku_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const data = await apiRequest<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setToken(data.token);
    setUser(data.user);

    localStorage.setItem('posv1_token', data.token);
    localStorage.setItem('posv1_user', JSON.stringify(data.user));

    // Also set document cookies for Next.js Edge Middleware
    const maxAge = 8 * 3600; // 8 hours
    document.cookie = `auth_token=${data.token}; path=/; max-age=${maxAge}; SameSite=Lax`;
    document.cookie = `auth_role=${data.user.role}; path=/; max-age=${maxAge}; SameSite=Lax`;

    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('posv1_token');
    localStorage.removeItem('posv1_user');
    localStorage.removeItem('kasirku_token');
    localStorage.removeItem('kasirku_user');
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
