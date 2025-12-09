// Training configuration types matching the backend Pydantic schema

// ============================================================================
// Training Configuration Schemas
// ============================================================================

export interface StockUniverseConfig {
  tickers: string[];
  useAllVn30: boolean;
}

export interface DataWindowConfig {
  windowType: 'n-days' | 'date-range';  // Maps to mode: "last_n_days" or "date-range"
  nDays: number | null;
  startDate?: string | null;
  endDate?: string | null;
  skipRefetch: boolean;
}

export interface IndicatorsConfig {
  smaWindows: number[];
  emaFast: number;
  emaSlow: number;
  useRoc: boolean;
  rsiWindow: number;
  macdFast: number;
  macdSlow: number;
  macdSignal: number;
  bbWindow: number;
  bbStd: number;
  atrWindow: number;
  volumeMaWindow: number;
  leakageGuard: boolean;
}

export interface TargetSplitsConfig {
  horizons: number[];  // e.g., [3, 7, 15, 30]
  lookbackWindow: number;
  trainPct: number;
  testPct: number;
}

export interface ModelParams {
  enabled: boolean;
  nEstimators?: number | null;
  maxDepth?: number | null;
  learningRate?: number | null;
  c?: number | null;
  epsilon?: number | null;
  gamma?: string | null;
  alpha?: number | null;
}

export interface ModelsConfig {
  randomForest: ModelParams;
  gradientBoosting: ModelParams;
  svr: ModelParams;
  ridge: ModelParams;
}

export interface ScalingConfig {
  method: 'standard' | 'none';
}

export interface EnsembleConfig {
  method: 'mean' | 'median' | 'weighted';
  learnWeights: boolean;
}

export interface ReproducibilityConfig {
  randomSeed: number;
}

// Full training configuration matching TrainingConfigSchema
export interface TrainingConfig {
  universe: StockUniverseConfig;
  dataWindow: DataWindowConfig;
  indicators: IndicatorsConfig;
  targets: TargetSplitsConfig;
  models: ModelsConfig;
  scaling: ScalingConfig;
  ensemble: EnsembleConfig;
  reproducibility: ReproducibilityConfig;
}

// ============================================================================
// API Response/Request Types
// ============================================================================

export interface TrainingConfigCreate {
  name: string;
  description?: string | null;
  config: TrainingConfig;
}

export interface TrainingConfigResponse {
  id: string;
  name: string;
  description?: string | null;
  config: TrainingConfig;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConfigSavedResponse {
  configId: string;
  savedAt: string;
}

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationBlocker {
  fieldPath: string;
  message: string;
}

export interface RunPreview {
  estRuntimeMinutes: number;
  estCost?: number | null;
}

export interface ValidateConfigResponse {
  isValid: boolean;
  blockers: ValidationBlocker[];
  warnings: ValidationBlocker[];
  runPreview?: RunPreview | null;
}

// Legacy types for backward compatibility
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ApiError {
  message: string;
  code?: string;
}
