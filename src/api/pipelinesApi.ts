// API client for Pipeline (Airflow) endpoints

import { getStoredToken } from './authApi';

const BASE_URL = 'http://localhost:8000';

// ============================================
// Types
// ============================================

export interface DAGResponse {
  dagId: string;
  name: string;
  description: string | null;
  status: 'active' | 'paused';
  scheduleCron: string;
  scheduleLabel: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastRunState: string | null;
}

export interface DAGDetailResponse {
  dagId: string;
  name: string;
  description: string | null;
  status: 'active' | 'paused';
  owner: string | null;
  tags: string[];
  timezone: string;
  scheduleCron: string;
  scheduleLabel: string | null;
  catchup: boolean;
  maxActiveRuns: number;
}

export interface DAGRunResponse {
  runId: string;
  dagId: string;
  conf: Record<string, unknown> | null;
  state: string;
  start: string | null;
  end: string | null;
  durationSeconds: number | null;
  triggeredBy: string;
}

export interface DAGRunsListResponse {
  data: DAGRunResponse[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
  };
}

export interface GraphNode {
  id: string;
  label: string;
  state: string;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GanttTask {
  taskId: string;
  label: string;
  start: string | null;
  end: string | null;
  state: string;
}

export interface GanttResponse {
  tasks: GanttTask[];
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
}

export interface LogsResponse {
  entries: LogEntry[];
  nextCursor: string | null;
}

export interface TriggerRunRequest {
  conf?: Record<string, unknown>;
}

export interface TriggerRunResponse {
  runId: string;
}

export interface PauseDAGRequest {
  paused: boolean;
}

export interface StopRunRequest {
  runId: string;
}

export interface DAGSettingsUpdate {
  scheduleCron?: string;
  timezone?: string;
  catchup?: boolean;
  maxActiveRuns?: number;
  defaultArgs?: {
    retries?: number;
    retryDelayMinutes?: number;
    owner?: string;
    tags?: string[];
  };
}

export interface SyncResponse {
  message: string;
  count: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
}

// ============================================
// API Client
// ============================================

class PipelinesApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: ApiError
  ) {
    super(message);
    this.name = 'PipelinesApiError';
  }
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

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetails: ApiError | undefined;
    try {
      errorDetails = await response.json();
    } catch {
      // Response body is not JSON
    }
    throw new PipelinesApiError(
      errorDetails?.error?.message || `HTTP error ${response.status}`,
      response.status,
      errorDetails
    );
  }
  return response.json();
}

// ============================================
// DAG Catalog Endpoints
// ============================================

/**
 * Sync DAGs from Airflow to local database
 * POST /api/v1/pipeline/dags/sync
 */
export async function syncDagsFromAirflow(): Promise<SyncResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/pipeline/dags/sync`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  return handleResponse<SyncResponse>(response);
}

/**
 * List all DAGs
 * GET /api/v1/pipeline/dags
 * @param source - "db" or "airflow" (default: "airflow")
 */
export async function listDags(source: 'db' | 'airflow' = 'airflow'): Promise<DAGResponse[]> {
  const url = new URL(`${BASE_URL}/api/v1/pipeline/dags`);
  url.searchParams.set('source', source);
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse<DAGResponse[]>(response);
}

/**
 * Get DAG details
 * GET /api/v1/pipeline/dags/{dagId}
 * @param source - "db" or "airflow" (default: "airflow")
 */
export async function getDAG(dagId: string, source: 'db' | 'airflow' = 'airflow'): Promise<DAGDetailResponse> {
  const url = new URL(`${BASE_URL}/api/v1/pipeline/dags/${dagId}`);
  url.searchParams.set('source', source);
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse<DAGDetailResponse>(response);
}

/**
 * Trigger a new DAG run
 * POST /api/v1/pipeline/dags/{dagId}/trigger
 */
export async function triggerDAGRun(
  dagId: string,
  request?: TriggerRunRequest
): Promise<TriggerRunResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/pipeline/dags/${dagId}/trigger`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: request ? JSON.stringify(request) : undefined,
  });
  return handleResponse<TriggerRunResponse>(response);
}

/**
 * Pause or resume a DAG
 * POST /api/v1/pipeline/dags/{dagId}/pause
 */
export async function pauseDAG(
  dagId: string,
  paused: boolean
): Promise<{ message: string }> {
  const response = await fetch(`${BASE_URL}/api/v1/pipeline/dags/${dagId}/pause`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ paused }),
  });
  return handleResponse<{ message: string }>(response);
}

/**
 * Stop an active DAG run
 * POST /api/v1/pipeline/dags/{dagId}/stopRun
 */
export async function stopDAGRun(
  dagId: string,
  runId: string
): Promise<{ message: string }> {
  const response = await fetch(`${BASE_URL}/api/v1/pipeline/dags/${dagId}/stopRun`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ runId }),
  });
  return handleResponse<{ message: string }>(response);
}

/**
 * Update DAG settings
 * PATCH /api/v1/pipeline/dags/{dagId}/settings
 */
export async function updateDAGSettings(
  dagId: string,
  settings: DAGSettingsUpdate
): Promise<DAGDetailResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/pipeline/dags/${dagId}/settings`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(settings),
  });
  return handleResponse<DAGDetailResponse>(response);
}

// ============================================
// DAG Run Endpoints
// ============================================

export interface ListDAGRunsOptions {
  source?: 'db' | 'airflow';
  state?: string;
  from?: string;
  to?: string;
  searchRunId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * List runs for a DAG
 * GET /api/v1/pipeline/dags/{dagId}/runs
 */
export async function listDAGRuns(
  dagId: string,
  options: ListDAGRunsOptions = {}
): Promise<DAGRunsListResponse> {
  const url = new URL(`${BASE_URL}/api/v1/pipeline/dags/${dagId}/runs`);
  
  if (options.source) url.searchParams.set('source', options.source);
  if (options.state) url.searchParams.set('state', options.state);
  if (options.from) url.searchParams.set('from', options.from);
  if (options.to) url.searchParams.set('to', options.to);
  if (options.searchRunId) url.searchParams.set('searchRunId', options.searchRunId);
  if (options.page) url.searchParams.set('page', options.page.toString());
  if (options.pageSize) url.searchParams.set('pageSize', options.pageSize.toString());
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse<DAGRunsListResponse>(response);
}

/**
 * Get run details
 * GET /api/v1/pipeline/runs/{runId}
 */
export async function getRun(runId: string): Promise<DAGRunResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/pipeline/runs/${runId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse<DAGRunResponse>(response);
}

/**
 * Get task graph for a run
 * GET /api/v1/pipeline/runs/{runId}/graph
 */
export async function getRunGraph(
  runId: string,
  dagId: string,
  source: 'db' | 'airflow' = 'airflow'
): Promise<GraphResponse> {
  const url = new URL(`${BASE_URL}/api/v1/pipeline/runs/${runId}/graph`);
  url.searchParams.set('dagId', dagId);
  url.searchParams.set('source', source);
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse<GraphResponse>(response);
}

/**
 * Get Gantt chart data for a run
 * GET /api/v1/pipeline/runs/{runId}/gantt
 */
export async function getRunGantt(
  runId: string,
  dagId: string,
  source: 'db' | 'airflow' = 'airflow'
): Promise<GanttResponse> {
  const url = new URL(`${BASE_URL}/api/v1/pipeline/runs/${runId}/gantt`);
  url.searchParams.set('dagId', dagId);
  url.searchParams.set('source', source);
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse<GanttResponse>(response);
}

/**
 * Get logs for a run
 * GET /api/v1/pipeline/runs/{runId}/logs
 */
export async function getRunLogs(
  runId: string,
  dagId: string,
  options: {
    taskId?: string;
    source?: 'db' | 'airflow';
    cursor?: string;
  } = {}
): Promise<LogsResponse> {
  const url = new URL(`${BASE_URL}/api/v1/pipeline/runs/${runId}/logs`);
  url.searchParams.set('dagId', dagId);
  
  if (options.taskId) url.searchParams.set('taskId', options.taskId);
  if (options.source) url.searchParams.set('source', options.source);
  if (options.cursor) url.searchParams.set('cursor', options.cursor);
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthHeaders(),
  });
  return handleResponse<LogsResponse>(response);
}

export { PipelinesApiError };

