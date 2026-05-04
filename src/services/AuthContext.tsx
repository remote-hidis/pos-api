import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DEFAULT_API_BASE_URL } from '../constants';

interface AuthContextType {
  user: any | null;
  token: string | null;
  baseUrl: string;
  login: (userData: any, token: string) => void;
  logout: () => void;
  updateBaseUrl: (url: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('pos_token'));
  const [baseUrl, setBaseUrl] = useState<string>(() => {
    const saved = localStorage.getItem('pos_base_url');
    // Migration for domain change
    if (saved && (saved.includes('pos-api.nganjuk.net') || saved.endsWith('/api'))) {
      const newUrl = DEFAULT_API_BASE_URL;
      localStorage.setItem('pos_base_url', newUrl);
      return newUrl;
    }
    return saved || DEFAULT_API_BASE_URL;
  });

  useEffect(() => {
    const savedUser = localStorage.getItem('pos_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (userData: any, token: string) => {
    setUser(userData);
    setToken(token);
    localStorage.setItem('pos_user', JSON.stringify(userData));
    localStorage.setItem('pos_token', token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('pos_user');
    localStorage.removeItem('pos_token');
  };

  const updateBaseUrl = (url: string) => {
    setBaseUrl(url);
    localStorage.setItem('pos_base_url', url);
  };

  return (
    <AuthContext.Provider value={{ user, token, baseUrl, login, logout, updateBaseUrl }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
