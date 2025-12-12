// Types for Models page data

// ============================================
// API Response Types (matching SPECS.md)
// ============================================

export interface ModelMape {
  "7d": number;
  "15d": number;
  "30d": number;
}

export interface ModelPredictions {
  "7d": number;
  "15d": number;
  "30d": number;
}

export interface ModelResponse {
  ticker: string;
  lastTrained: string;  // ISO timestamp
  mape: ModelMape;
  predictions: ModelPredictions;
  plotUrl: string;  // S3 URL to evaluation plot
}

// ============================================
// UI Display Types
// ============================================

export interface ModelData {
  ticker: string;
  companyName: string;
  lastTrained: string;  // Formatted relative time for display
  mape7d: number;
  mape15d: number;
  mape30d: number;
  pred7d: number;
  pred15d: number;
  pred30d: number;
  plotUrl: string;
}
