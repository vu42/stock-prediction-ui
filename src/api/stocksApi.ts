// API client for stocks endpoints

import { authenticatedFetch } from './authApi';

const BASE_URL = 'http://localhost:8000';

// ============================================
// Types
// ============================================

export interface TopPick {
  ticker: string;
  name: string;
  sector: string | null;
  horizonDays: number;
  predictedChangePct: number;
  currentPrice: number | null;
}

export interface MyListItem {
  ticker: string;
  name: string;
  sector: string | null;
  horizonDays: number;
  predictedChangePct: number;
  currentPrice: number | null;
  addedAt: string;
}

export interface PctChange {
  actualPct: number | null;
  actualPrice: number | null;
}

export interface PredictedPctChange {
  predictedPct: number | null;
  predictedPrice: number | null;
}

export interface SparklinePoint {
  date: string;
  price: number;
  isPredicted: boolean;
}

export interface MarketTableItem {
  symbol: string;
  name: string;
  sector: string | null;
  currentPrice: number | null;
  pctChange: {
    '7d'?: PctChange;
    '15d'?: PctChange;
    '30d'?: PctChange;
  };
  predictedPctChange: {
    '7d'?: PredictedPctChange;
  };
  sparkline14d: SparklinePoint[];
}

export interface MarketTableMeta {
  total: number;
  page: number;
  pageSize: number;
  sectors: string[];
}

export interface MarketTableResponse {
  data: MarketTableItem[];
  meta: MarketTableMeta;
}

export interface StockDetail {
  ticker: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  sector: string | null;
  exchange: string | null;
  marketCap: number | null;
  tradingVolume: number | null;
  links: {
    financialReportUrl: string | null;
    companyWebsiteUrl: string | null;
  } | null;
}

export interface StockPredictions {
  ticker: string;
  horizons: {
    [key: string]: {
      predictedChangePct: number | null;
    };
  };
}

export interface ChartPoint {
  date: string;
  actualPrice: number | null;
  predictedPrice: number | null;
}

export interface ChartData {
  points: ChartPoint[];
  historicalRange: string;
  predictionRange: string;
}

export interface HorizonMetric {
  mapePct: number;
}

export interface ModelStatus {
  state: 'fresh' | 'stable' | 'stale';
  lastUpdatedAt: string | null;
  metrics: {
    [key: string]: HorizonMetric;
  };
}

class StocksApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'StocksApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorDetails: any;
    try {
      errorDetails = await response.json();
    } catch {
      // Response body is not JSON
    }
    throw new StocksApiError(
      errorDetails?.message || `HTTP error ${response.status}`,
      response.status,
      errorDetails
    );
  }
  return response.json();
}

// ============================================
// API Functions
// ============================================

/**
 * Get top stock picks for "Should Buy" or "Should Sell" tabs
 * GET /api/v1/stocks/top-picks
 */
export async function getTopPicks(
  bucket: 'should_buy' | 'should_sell' = 'should_buy',
  limit: number = 5,
  horizonDays: number = 7
): Promise<TopPick[]> {
  const url = new URL(`${BASE_URL}/api/v1/stocks/top-picks`);
  url.searchParams.set('bucket', bucket);
  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('horizonDays', horizonDays.toString());

  const response = await authenticatedFetch(url.toString(), {
    method: 'GET',
  });
  return handleResponse<TopPick[]>(response);
}

/**
 * Get user's saved stocks (My List)
 * GET /api/v1/stocks/my-list
 */
export async function getMyList(
  limit: number = 5,
  horizonDays: number = 7
): Promise<MyListItem[]> {
  const url = new URL(`${BASE_URL}/api/v1/stocks/my-list`);
  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('horizonDays', horizonDays.toString());

  const response = await authenticatedFetch(url.toString(), {
    method: 'GET',
  });
  return handleResponse<MyListItem[]>(response);
}

/**
 * Add stock to user's My List
 * POST /api/v1/stocks/my-list/{ticker}
 */
export async function addToMyList(ticker: string): Promise<{ message: string; ticker: string; name: string }> {
  const response = await authenticatedFetch(`${BASE_URL}/api/v1/stocks/my-list/${ticker}`, {
    method: 'POST',
  });
  return handleResponse<{ message: string; ticker: string; name: string }>(response);
}

/**
 * Remove stock from user's My List
 * DELETE /api/v1/stocks/my-list/{ticker}
 */
export async function removeFromMyList(ticker: string): Promise<{ message: string }> {
  const response = await authenticatedFetch(`${BASE_URL}/api/v1/stocks/my-list/${ticker}`, {
    method: 'DELETE',
  });
  return handleResponse<{ message: string }>(response);
}

/**
 * Get market table data with search, filter, sort, and pagination
 * GET /api/v1/stocks/market-table
 */
export async function getMarketTable(
  options: {
    search?: string;
    sector?: string;
    sortBy?: 'change_7d' | 'change_15d' | 'change_30d' | 'price' | 'predicted_change_7d';
    sortDir?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  } = {}
): Promise<MarketTableResponse> {
  const url = new URL(`${BASE_URL}/api/v1/stocks/market-table`);
  
  if (options.search) {
    url.searchParams.set('search', options.search);
  }
  if (options.sector) {
    url.searchParams.set('sector', options.sector);
  }
  if (options.sortBy) {
    url.searchParams.set('sortBy', options.sortBy);
  }
  if (options.sortDir) {
    url.searchParams.set('sortDir', options.sortDir);
  }
  if (options.page) {
    url.searchParams.set('page', options.page.toString());
  }
  if (options.pageSize) {
    url.searchParams.set('pageSize', options.pageSize.toString());
  }

  const response = await authenticatedFetch(url.toString(), {
    method: 'GET',
  });
  return handleResponse<MarketTableResponse>(response);
}

/**
 * Get stock detail information
 * GET /api/v1/stocks/{ticker}
 */
export async function getStockDetail(ticker: string): Promise<StockDetail> {
  const response = await authenticatedFetch(`${BASE_URL}/api/v1/stocks/${ticker}`, {
    method: 'GET',
  });
  return handleResponse<StockDetail>(response);
}

/**
 * Get stock predictions for specified horizons
 * GET /api/v1/stocks/{ticker}/predictions
 */
export async function getStockPredictions(
  ticker: string,
  horizons: number[] = [7, 15, 30]
): Promise<StockPredictions> {
  const url = new URL(`${BASE_URL}/api/v1/stocks/${ticker}/predictions`);
  url.searchParams.set('horizons', horizons.join(','));
  
  const response = await authenticatedFetch(url.toString(), {
    method: 'GET',
  });
  return handleResponse<StockPredictions>(response);
}

/**
 * Get chart data for stock
 * GET /api/v1/stocks/{ticker}/chart
 */
export async function getStockChart(
  ticker: string,
  historicalRange: '15d' | '30d' | '60d' | '90d' = '30d',
  predictionRange: '7d' | '15d' | '30d' = '7d'
): Promise<ChartData> {
  const url = new URL(`${BASE_URL}/api/v1/stocks/${ticker}/chart`);
  url.searchParams.set('historicalRange', historicalRange);
  url.searchParams.set('predictionRange', predictionRange);
  
  const response = await authenticatedFetch(url.toString(), {
    method: 'GET',
  });
  return handleResponse<ChartData>(response);
}

/**
 * Get model status for stock
 * GET /api/v1/models/{ticker}/status
 */
export async function getModelStatus(ticker: string): Promise<ModelStatus> {
  const response = await authenticatedFetch(`${BASE_URL}/api/v1/models/${ticker}/status`, {
    method: 'GET',
  });
  return handleResponse<ModelStatus>(response);
}

export { StocksApiError };

