// Authentication Context and Provider

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { 
  login as apiLogin, 
  logout as apiLogout, 
  getCurrentUser,
  getStoredToken,
  getStoredRefreshToken,
  getStoredUser,
  refreshAccessToken,
  type User,
  type LoginRequest,
  AuthApiError
} from '../api/authApi';
import { toast } from 'sonner';

// ============================================
// Context Types
// ============================================

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Provider Component
// ============================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check existing session on mount - always call /me to validate session
  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      const refreshToken = getStoredRefreshToken();
      const storedUser = getStoredUser();
      
      // If we have tokens, always validate session by calling /me
      if (token || refreshToken) {
        console.log("initAuth>>> token or refreshToken");
        try {
          // Try to get current user - this will use authenticatedFetch which handles token refresh automatically
          const currentUser = await getCurrentUser();
          console.log("initAuth>>> currentUser", currentUser);
          // Session is valid, set user
          setUser(currentUser);
        } catch (error) {
          console.log("initAuth>>> error", error);
          // /me failed - check if we can refresh
          if (refreshToken && !token) {
            // No access token but have refresh token - try to refresh
            try {
              const refreshData = await refreshAccessToken();
              // Refresh successful, try /me again
              const currentUser = await getCurrentUser();
              setUser(currentUser);
            } catch (refreshError) {
              // Refresh failed - session invalid, clear everything
              setUser(null);
            }
          } else {
            console.log("initAuth>>> no refresh token or token");
            // /me failed and no refresh token, or refresh already attempted and failed
            // Session is invalid, clear everything
            setUser(null);
          }
        }
      } else if (storedUser) {
        // Have stored user but no tokens - clear user
        console.log("initAuth>>> storedUser but no tokens");
        setUser(null);
      } else {
        // No tokens and no stored user - user not logged in
        console.log("initAuth>>> no tokens and no stored user");
        setUser(null);
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      const response = await apiLogin(credentials);
      setUser(response.user);
      toast.success(`Welcome back, ${response.user.displayName}!`);
      return response;
    } catch (error) {
      if (error instanceof AuthApiError) {
        toast.error(error.message);
      } else {
        toast.error('Login failed. Please try again.');
      }
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  console.log("🐧 > useAuth > context:", context);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
