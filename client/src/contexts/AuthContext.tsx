import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshAccessToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Token refresh threshold (refresh before expiry)
const TOKEN_REFRESH_THRESHOLD = 2 * 60 * 1000; // 2 minutes before expiry
const REFRESH_COOLDOWN = 30 * 1000; // 30 seconds cooldown between refreshes

let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
let lastRefreshTime = 0;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
        scheduleTokenRefresh();
      } catch (e) {
        // Invalid stored user, clear it
        clearAuth();
      }
    }
    setIsLoading(false);
  }, []);

  // Schedule token refresh before expiry
  const scheduleTokenRefresh = () => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Parse JWT to get expiry time
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiryTime - now;

      // Schedule refresh
      if (timeUntilExpiry > TOKEN_REFRESH_THRESHOLD) {
        refreshTimeout = setTimeout(() => {
          refreshAccessToken();
        }, timeUntilExpiry - TOKEN_REFRESH_THRESHOLD);
      } else {
        // Token already near expiry, refresh now
        refreshAccessToken();
      }
    } catch (e) {
      console.error('Failed to parse token:', e);
    }
  };

  // Refresh access token
  const refreshAccessToken = async (): Promise<boolean> => {
    // Rate limit - don't refresh if recently refreshed
    const now = Date.now();
    if (now - lastRefreshTime < REFRESH_COOLDOWN) {
      console.log('Refresh cooldown active, skipping');
      return true; // Return true to avoid triggering logout
    }

    lastRefreshTime = now;

    try {
      const response = await fetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Important: include cookies for httpOnly refresh token
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.accessToken);
        scheduleTokenRefresh();
        return true;
      } else {
        // Refresh failed, need to re-login
        await clearAuth();
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await clearAuth();
      return false;
    }
  };

  // Login
  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login gagal');
    }

    setUser(data.user);
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.accessToken);

    // Schedule token refresh
    scheduleTokenRefresh();
  };

  // Logout
  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await clearAuth();
    }
  };

  // Clear auth data
  const clearAuth = async () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        isAuthenticated: !!user,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
