// API client for training configuration endpoints

import type { TrainingConfig, ValidationResult, ApiError } from '../types/training';
import { authenticatedFetch } from './authApi';

const BASE_URL = 'http://localhost:8000';

class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: ApiError
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetails: ApiError | undefined;
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

// ============================================
// Training Configuration Endpoints
// ============================================

/**
 * Fetch the current saved training configuration
 * GET /api/v1/features/config
 * Returns TrainingConfigResponse with nested config
 */
export async function fetchTrainingConfig(): Promise<TrainingConfig> {
  const response = await authenticatedFetch(`${BASE_URL}/api/v1/features/config`, {
    method: 'GET',
  });
  // Response is { id, name, config: {...}, version, ... }
  // We need to extract just the config
  const data = await handleResponse<{ config: TrainingConfig }>(response);
  return data.config;
}

/**
 * Save (create/update) the training configuration
 * POST /api/v1/features/config
 * Body: { name, config }
 * Returns: { configId, savedAt }
 */
export interface SaveConfigResponse {
  configId: string;
  savedAt: string;
}

export async function saveTrainingConfig(config: TrainingConfig): Promise<SaveConfigResponse> {
  const requestBody = {
    name: 'Training Config',
    config,
  };
  const response = await authenticatedFetch(`${BASE_URL}/api/v1/features/config`, {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
  return handleResponse<SaveConfigResponse>(response);
}

/**
 * Validate the training configuration and get run preview
 * POST /api/v1/features/validate
 */
export interface ValidateConfigResponse {
  isValid: boolean;
  blockers: Array<{ fieldPath: string; message: string }>;
  warnings: Array<{ fieldPath: string; message: string }>;
  runPreview?: {
    estRuntimeMinutes: number;
    estCost?: number;
  };
}

export async function validateTrainingConfig(config: TrainingConfig): Promise<ValidateConfigResponse> {
  const response = await authenticatedFetch(`${BASE_URL}/api/v1/features/validate`, {
    method: 'POST',
    body: JSON.stringify(config),
  });
  return handleResponse<ValidateConfigResponse>(response);
}

// ============================================
// Experiment Run Endpoints
// ============================================

/**
 * Start a new training run
 * POST /api/v1/experiments/run
 */
export interface StartRunRequest {
  configId: string;
  scope: 'all_vn30' | 'selected';
  seeds: { globalSeed: number };
  notes?: string;
}

export interface StartRunResponse {
  runId: string;
}

export async function startTrainingRun(request: StartRunRequest): Promise<StartRunResponse> {
  const response = await authenticatedFetch(`${BASE_URL}/api/v1/experiments/run`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return handleResponse<StartRunResponse>(response);
}

/**
 * Get experiment run status (for Active Run panel)
 * GET /api/v1/experiments/{runId}
 */
export interface RunStatus {
  runId: string;
  state: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progressPct: number;
  eta?: string;
  startedAt: string;
  finishedAt?: string;
  scope: string;
  notes?: string;
}

export async function getRunStatus(runId: string): Promise<RunStatus> {
  const response = await authenticatedFetch(`${BASE_URL}/api/v1/experiments/${runId}`, {
    method: 'GET',
  });
  return handleResponse<RunStatus>(response);
}

/**
 * Get run logs (for Log Tail area)
 * GET /api/v1/experiments/{runId}/logs/tail
 */
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
}

export interface LogsResponse {
  entries: LogEntry[];
  nextCursor?: string;
}

export async function getRunLogs(runId: string, cursor?: string): Promise<LogsResponse> {
  const url = new URL(`${BASE_URL}/api/v1/experiments/${runId}/logs/tail`);
  if (cursor) {
    url.searchParams.set('cursor', cursor);
  }
  const response = await authenticatedFetch(url.toString(), {
    method: 'GET',
  });
  return handleResponse<LogsResponse>(response);
}

/**
 * List past runs
 * GET /api/v1/experiments/runs
 */
export interface PastRun {
  runId: string;
  createdAt: string;
  state: string;
  configSummary: string;
}

export interface ListRunsResponse {
  data: PastRun[];
  meta: { nextCursor?: string };
}

export async function listRuns(options?: { limit?: number; cursor?: string; state?: string }): Promise<ListRunsResponse> {
  const url = new URL(`${BASE_URL}/api/v1/experiments/runs`);
  if (options?.limit) url.searchParams.set('limit', options.limit.toString());
  if (options?.cursor) url.searchParams.set('cursor', options.cursor);
  if (options?.state) url.searchParams.set('state', options.state);
  
  const response = await authenticatedFetch(url.toString(), {
    method: 'GET',
  });
  return handleResponse<ListRunsResponse>(response);
}

/**
 * Get run artifacts
 * GET /api/v1/experiments/{runId}/artifacts
 */
export interface ArtifactFile {
  type: 'evaluation_png' | 'future_png' | 'model_pkl' | 'scaler_pkl' | 'future_predictions_csv';
  url: string;
}

export interface TickerArtifact {
  ticker: string;
  metrics: {
    mape7dPct?: number;
    mape15dPct?: number;
    mape30dPct?: number;
    [key: string]: number | undefined;
  };
  files: ArtifactFile[];
}

export interface ArtifactsResponse {
  tickerArtifacts: TickerArtifact[];
}

export async function getRunArtifacts(runId: string, ticker?: string): Promise<ArtifactsResponse> {
  const url = new URL(`${BASE_URL}/api/v1/experiments/${runId}/artifacts`);
  if (ticker) {
    url.searchParams.set('ticker', ticker);
  }
  const response = await authenticatedFetch(url.toString(), {
    method: 'GET',
  });
  return handleResponse<ArtifactsResponse>(response);
}

export { ApiClientError };
