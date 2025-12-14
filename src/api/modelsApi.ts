// API client for models endpoints

import type { ModelResponse } from '../types/models';
import { getStoredToken } from './authApi';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: { message: string; code?: string }
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetails: { message: string; code?: string } | undefined;
    try {
      errorDetails = await response.json();
    } catch {
      // Response body is not JSON
    }
    throw new ApiClientError(
      errorDetails?.message || `HTTP error ${response.status}`,
      response.status,
      errorDetails
    );
  }
  return response.json();
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ============================================
// Models Endpoints
// ============================================

/**
 * Fetch all trained models with performance metrics and predictions
 * GET /api/v1/models
 * 
 * Response: Array of model data for each VN30 stock with:
 * - ticker: Stock symbol
 * - lastTrained: ISO timestamp of last training run
 * - mape: MAPE percentages for 7d, 15d, 30d horizons
 * - predictions: Predicted % changes for 7d, 15d, 30d horizons
 * - plotUrl: S3 URL to evaluation plot image
 */
export async function fetchModels(): Promise<ModelResponse[]> {
  const response = await fetch(`${BASE_URL}/api/v1/models`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse<ModelResponse[]>(response);
}

export { ApiClientError };
