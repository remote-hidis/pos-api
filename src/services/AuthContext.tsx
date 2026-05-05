import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DEFAULT_API_BASE_URL } from '../constants';

interface AuthContextType {
  user: any | null;
  token: string | null;
  baseUrl: string;
  whatsappUrl: string;
  whatsappApiKey: string;
  whatsappGreeting: string;
  login: (userData: any, token: string) => void;
  logout: () => void;
  updateBaseUrl: (url: string) => void;
  updateWhatsappUrl: (url: string) => void;
  updateWhatsappApiKey: (key: string) => void;
  updateWhatsappGreeting: (text: string) => void;
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
  const [whatsappUrl, setWhatsappUrl] = useState<string>(() => {
    return localStorage.getItem('pos_wa_url') || 'https://wa.nganjuk.net';
  });
  const [whatsappApiKey, setWhatsappApiKey] = useState<string>(() => {
    return localStorage.getItem('pos_wa_key') || '';
  });
  const [whatsappGreeting, setWhatsappGreeting] = useState<string>(() => {
    return localStorage.getItem('pos_wa_greeting') || 'Terima kasih telah berbelanja di toko kami!';
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

  const updateWhatsappUrl = (url: string) => {
    setWhatsappUrl(url);
    localStorage.setItem('pos_wa_url', url);
  };

  const updateWhatsappApiKey = (key: string) => {
    setWhatsappApiKey(key);
    localStorage.setItem('pos_wa_key', key);
  };

  const updateWhatsappGreeting = (text: string) => {
    setWhatsappGreeting(text);
    localStorage.setItem('pos_wa_greeting', text);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      baseUrl, 
      whatsappUrl, 
      whatsappApiKey, 
      whatsappGreeting, 
      login, 
      logout, 
      updateBaseUrl, 
      updateWhatsappUrl,
      updateWhatsappApiKey,
      updateWhatsappGreeting
    }}>
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
