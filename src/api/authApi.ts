// Authentication API client

const BASE_URL = 'http://localhost:8000';

// ============================================
// Types
// ============================================

export interface User {
  id: string;
  username: string;
  role: 'end_user' | 'data_scientist';
  displayName: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: User;
}

export interface AuthError {
  code: string;
  message: string;
}

// ============================================
// Token Storage
// ============================================

const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'authUser';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser(): User | null {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthStorage(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ============================================
// API Functions
// ============================================

class AuthApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

/**
 * Login with username and password
 * POST /api/v1/auth/login
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    let errorData: AuthError | undefined;
    try {
      errorData = await response.json();
    } catch {
      // Response body is not JSON
    }
    throw new AuthApiError(
      errorData?.message || 'Invalid credentials',
      response.status,
      errorData?.code
    );
  }

  const data: LoginResponse = await response.json();
  
  // Store ACCESS token (not refresh token) for API calls
  setStoredToken(data.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  setStoredUser(data.user);
  
  return data;
}

/**
 * Get current user session
 * GET /api/v1/auth/me
 */
export async function getCurrentUser(): Promise<User> {
  const token = getStoredToken();
  
  if (!token) {
    throw new AuthApiError('No token found', 401);
  }

  const response = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthStorage();
    }
    throw new AuthApiError('Session expired', response.status);
  }

  const data = await response.json();
  
  // Update stored user
  setStoredUser(data.user);
  
  return data.user;
}

/**
 * Logout - clear stored credentials
 */
export function logout(): void {
  clearAuthStorage();
}

export { AuthApiError };
