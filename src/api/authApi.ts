// Authentication API client

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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

export function getStoredRefreshToken(): string | null {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  console.log("getStoredRefreshToken>>> refreshToken", refreshToken);
  return refreshToken;
}

export function setStoredRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
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
  
  // Store both access and refresh tokens
  setStoredToken(data.accessToken);
  setStoredRefreshToken(data.refreshToken);
  const storedUser: User = {
    id: data.user.id,
    username: data.user.username,
    role: data.user.role,
    displayName: data.user.displayName,
  }
  setStoredUser(storedUser);
  
  return data;
}

/**
 * Refresh access token using refresh token
 * POST /api/v1/auth/refresh
 */
export async function refreshAccessToken(): Promise<LoginResponse> {
  const refreshToken = getStoredRefreshToken();
  console.log("refreshAccessToken>>> refreshToken", refreshToken);
  
  if (!refreshToken) {
    throw new AuthApiError('No refresh token found', 401);
  }

  try {
    const response = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: refreshToken }),
    });

    if (!response.ok) {
      // Only clear storage if it's an authentication error (401, 403)
      // Other errors (500, network) should not clear storage
      if (response.status === 401 || response.status === 403) {
        clearAuthStorage();
        throw new AuthApiError('Refresh token expired', response.status);
      } else {
        // Server error or other issue - don't clear storage
        throw new AuthApiError('Failed to refresh token', response.status);
      }
    }

    const data: LoginResponse = await response.json();
    
    // Store new tokens
    setStoredToken(data.accessToken);
    setStoredRefreshToken(data.refreshToken);
    setStoredUser(data.user);
    
    return data;
  } catch (error) {
    // If it's already an AuthApiError, re-throw it
    if (error instanceof AuthApiError) {
      throw error;
    }
    // Network error or other fetch error - don't clear storage
    throw new AuthApiError('Network error while refreshing token', 0);
  }
}

/**
 * Get current user session
 * GET /api/v1/auth/me
 */
export async function getCurrentUser(): Promise<User> {
  const token = getStoredToken();
  const refreshToken = getStoredRefreshToken();
  console.log("getCurrentUser>>> token", token);
  console.log("getCurrentUser>>> refreshToken", refreshToken);
  // If no access token but have refresh token, try to refresh first
  if (!token && refreshToken) {
    try {
      const refreshData = await refreshAccessToken();
      // After refresh, we should have a token now
    } catch (error) {
      // Refresh failed, session invalid
      throw new AuthApiError('Session expired', 401);
    }
  }
  
  if (!getStoredToken()) {
    throw new AuthApiError('No token found', 401);
  }

  // Use authenticatedFetch to automatically handle token refresh
  const response = await authenticatedFetch(`${BASE_URL}/api/v1/auth/me`, {
    method: 'GET',
  });
  console.log("getCurrentUser>>> response", response);

  if (!response.ok) {
    // authenticatedFetch already tried to refresh token
    // If still failing, it means refresh also failed and storage was cleared
    throw new AuthApiError('Session expired', response.status);
  }

  const data = await response.json();
  
  // Update stored user
  const storedUser: User = {
    id: data.id,
    username: data.username,
    role: data.role,
    displayName: data.displayName,
  }
  setStoredUser(storedUser);
  console.log("getCurrentUser>>> data", data);
  return storedUser;
}

/**
 * Logout - clear stored credentials
 */
export function logout(): void {
  clearAuthStorage();
}

// ============================================
// Authenticated Fetch Wrapper
// ============================================

let isRefreshing = false;
let refreshPromise: Promise<LoginResponse> | null = null;

/**
 * Authenticated fetch wrapper that automatically refreshes tokens on 401 errors
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getStoredToken();
  
  // Add authorization header if token exists
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response = await fetch(url, {
    ...options,
    headers,
  });

  // If 401, try to refresh token and retry
  if (response.status === 401 && token) {
    // Prevent multiple simultaneous refresh attempts
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshAccessToken();
    }

    try {
      await refreshPromise;
      // Retry original request with new token
      const newToken = getStoredToken();
      if (newToken) {
        headers.set('Authorization', `Bearer ${newToken}`);
        response = await fetch(url, {
          ...options,
          headers,
        });
      } else {
        // No token after refresh - refreshAccessToken already cleared storage if needed
        throw new AuthApiError('Authentication failed', 401);
      }
    } catch (error) {
      // Only clear storage if it's an auth error (401/403)
      // refreshAccessToken already handles clearing storage for expired tokens
      if (error instanceof AuthApiError && (error.status === 401 || error.status === 403)) {
        // Storage already cleared by refreshAccessToken if token expired
        // Just re-throw the error
        throw error;
      }
      // Network errors or other issues - don't clear storage, just throw
      throw error;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  }

  return response;
}

export { AuthApiError };
