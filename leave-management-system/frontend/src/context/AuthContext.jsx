import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const login = useCallback((jwtToken, userData) => {
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
    setUser(userData);
  }, []);

  const register = useCallback(async (data) => {
    return await authService.register(data);
  }, []);

  const updateUser = useCallback((partialData) => {
    setUser((prev) => (prev ? { ...prev, ...partialData } : prev));
  }, []);

  // Restore authentication and validate token with backend on reload
  useEffect(() => {
    let isMounted = true;

    const restoreAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        // Validate token with GET /api/auth/me (Do not trust local role)
        const currentUser = await authService.getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
          setToken(storedToken);
        }
      } catch (err) {
        // If token is invalid or expired, clear state
        if (isMounted) {
          logout();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    restoreAuth();

    // Listen for unauthorized / expired events from api interceptor
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:expired', handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:expired', handleUnauthorized);
    };
  }, [logout]);

  const value = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    register,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
