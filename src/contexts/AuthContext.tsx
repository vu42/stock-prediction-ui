// Authentication Context and Provider

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { 
  login as apiLogin, 
  logout as apiLogout, 
  getCurrentUser,
  getStoredToken,
  getStoredUser,
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

  // Check existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      const storedUser = getStoredUser();
      
      if (token && storedUser) {
        // Try to verify token with backend
        try {
          const currentUser = await getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token invalid, use stored user as fallback or clear
          if (error instanceof AuthApiError && error.status === 401) {
            setUser(null);
          } else {
            // Network error - use cached user
            setUser(storedUser);
          }
        }
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
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
