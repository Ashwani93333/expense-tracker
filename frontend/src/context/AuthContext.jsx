import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi, getToken, setToken, clearToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // true until we verify stored token
  const [authError, setAuthError] = useState(null);

  // On mount — try to restore session from stored token
  useEffect(() => {
    const restore = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const user = await authApi.me();
        setCurrentUser(user);
      } catch {
        clearToken(); // Token invalid/expired — clear it
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    const data = await authApi.login({ email, password });
    setToken(data.token);
    setCurrentUser(data.user);
    return data.user;
  };

  const signup = async ({ fullName, email, password, avatarUrl }) => {
    setAuthError(null);
    const data = await authApi.signup({ fullName, email, password, avatarUrl });
    setToken(data.token);
    setCurrentUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors on logout; always clear local state
    } finally {
      clearToken();
      setCurrentUser(null);
    }
  };

  const updateCurrentUser = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated: !!currentUser,
      isLoading,
      authError,
      login,
      signup,
      logout,
      updateCurrentUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
