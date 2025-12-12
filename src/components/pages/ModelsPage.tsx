import { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { ArrowUp, ArrowDown, BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fetchModels } from '../../api/modelsApi';
import type { ModelData } from '../../types/models';

// VN30 company names for display purposes
const vn30CompanyNames: Record<string, string> = {
  'FPT': 'FPT Corporation',
  'VCB': 'Vietcombank',
  'VNM': 'Vinamilk',
  'HPG': 'Hoa Phat Group',
  'VIC': 'Vingroup',
  'VHM': 'Vinhomes',
  'MSN': 'Masan Group',
  'SAB': 'Sabeco',
  'TCB': 'Techcombank',
  'GAS': 'PetroVietnam Gas',
};

// Format percentage to 2 decimal places
const formatPct = (value: number | null | undefined): string => {
  if (value == null) return 'N/A';
  return value.toFixed(2);
};

// Check if prediction value is valid
const isPredictionValid = (value: number | null | undefined): boolean => {
  return value != null && !isNaN(value);
};

// Get MAPE color based on value
const getMapeColor = (value: number | null | undefined): string => {
  if (value == null) return 'text-gray-500';
  if (value < 5) return 'text-green-600';
  if (value <= 10) return 'text-yellow-600';
  return 'text-red-600';
};

const getMapeBackgroundColor = (value: number | null | undefined): string => {
  if (value == null) return 'bg-gray-100';
  if (value < 5) return 'bg-green-100';
  if (value <= 10) return 'bg-yellow-100';
  return 'bg-red-100';
};

const getMapeBorderColor = (value: number | null | undefined): string => {
  if (value == null) return 'border-gray-200';
  if (value < 5) return 'border-green-200';
  if (value <= 10) return 'border-yellow-200';
  return 'border-red-200';
};

type ViewState = 'loading' | 'error' | 'empty' | 'default';

export function ModelsPage() {
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [modelData, setModelData] = useState<ModelData[]>([]);
  const [selectedModel, setSelectedModel] = useState<ModelData | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const loadModels = useCallback(async () => {
    setViewState('loading');
    try {
      const response = await fetchModels();
      
      if (response.length === 0) {
        setViewState('empty');
        setModelData([]);
        return;
      }

      // Transform API response to UI format
      const transformedData: ModelData[] = response.map((model) => ({
        ticker: model.ticker,
        companyName: vn30CompanyNames[model.ticker] || model.ticker,
        lastTrained: formatDistanceToNow(new Date(model.lastTrained), { addSuffix: true }),
        mape7d: model.mape['7d'],
        mape15d: model.mape['15d'],
        mape30d: model.mape['30d'],
        pred7d: model.predictions['7d'],
        pred15d: model.predictions['15d'],
        pred30d: model.predictions['30d'],
        plotUrl: model.plotUrl,
      }));

      setModelData(transformedData);
      setViewState('default');
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setViewState('error');
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  const handleViewClick = (model: ModelData) => {
    setSelectedModel(model);
    setImageLoading(true);
    setImageError(false);
  };

  const handleCloseModal = () => {
    setSelectedModel(null);
    setImageLoading(false);
    setImageError(false);
  };

  const handleRetry = () => {
    loadModels();
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-gray-900 mb-2">Models Overview</h1>
          <p className="text-gray-600">Performance and predictions for trained VN30 models</p>
        </div>

        {/* Main Table Card */}
        <Card className="bg-white shadow-sm">
          {/* Error State Banner */}
          {viewState === 'error' && (
            <div className="px-4 py-3 border-b bg-red-50 border-red-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-700">There was a problem loading models.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  className="cursor-pointer h-8"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-3 text-gray-700 px-2">Name / Symbol</th>
                    <th className="text-left pb-3 text-gray-700 px-2">Last Trained</th>
                    <th className="text-left pb-3 text-gray-700 px-2">MAPE 7D</th>
                    <th className="text-left pb-3 text-gray-700 px-2">MAPE 15D</th>
                    <th className="text-left pb-3 text-gray-700 px-2">MAPE 30D</th>
                    <th className="text-left pb-3 text-gray-700 px-2">Pred 7D</th>
                    <th className="text-left pb-3 text-gray-700 px-2">Pred 15D</th>
                    <th className="text-left pb-3 text-gray-700 px-2">Pred 30D</th>
                    <th className="text-left pb-3 text-gray-700 px-2">View</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Loading State */}
                  {viewState === 'loading' && (
                    <>
                      {[...Array(10)].map((_, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="py-4 px-2">
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-3 w-24" />
                          </td>
                          <td className="py-4 px-2"><Skeleton className="h-4 w-20" /></td>
                          <td className="py-4 px-2"><Skeleton className="h-6 w-14" /></td>
                          <td className="py-4 px-2"><Skeleton className="h-6 w-14" /></td>
                          <td className="py-4 px-2"><Skeleton className="h-6 w-14" /></td>
                          <td className="py-4 px-2"><Skeleton className="h-4 w-16" /></td>
                          <td className="py-4 px-2"><Skeleton className="h-4 w-16" /></td>
                          <td className="py-4 px-2"><Skeleton className="h-4 w-16" /></td>
                          <td className="py-4 px-2"><Skeleton className="h-8 w-16" /></td>
                        </tr>
                      ))}
                    </>
                  )}

                  {/* Empty State */}
                  {viewState === 'empty' && (
                    <tr>
                      <td colSpan={9} className="text-center py-16">
                        <div className="flex flex-col items-center gap-2">
                          <p className="text-gray-900">No models found</p>
                          <p className="text-sm text-gray-600">
                            Train VN30 models from the Training page to see them here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Default State - Show Data */}
                  {viewState === 'default' && modelData.map((model) => (
                    <tr 
                      key={model.ticker}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 px-2">
                        <div className="flex flex-col">
                          <span className="text-gray-900">{model.ticker}</span>
                          <span className="text-sm text-gray-500">{model.companyName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-sm text-gray-600">{model.lastTrained}</span>
                      </td>
                      
                      {/* MAPE Columns with color coding */}
                      <td className="py-4 px-2">
                        <Badge
                          className={`${getMapeBackgroundColor(model.mape7d)} ${getMapeColor(model.mape7d)} ${getMapeBorderColor(model.mape7d)}`}
                        >
                          {formatPct(model.mape7d)}%
                        </Badge>
                      </td>
                      <td className="py-4 px-2">
                        <Badge
                          className={`${getMapeBackgroundColor(model.mape15d)} ${getMapeColor(model.mape15d)} ${getMapeBorderColor(model.mape15d)}`}
                        >
                          {formatPct(model.mape15d)}%
                        </Badge>
                      </td>
                      <td className="py-4 px-2">
                        <Badge
                          className={`${getMapeBackgroundColor(model.mape30d)} ${getMapeColor(model.mape30d)} ${getMapeBorderColor(model.mape30d)}`}
                        >
                          {formatPct(model.mape30d)}%
                        </Badge>
                      </td>

                      {/* Prediction Columns with arrows */}
                      <td className="py-4 px-2">
                        {isPredictionValid(model.pred7d) ? (
                          <div className={`flex items-center gap-1 ${model.pred7d! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {model.pred7d! >= 0 ? (
                              <>
                                <ArrowUp className="w-3.5 h-3.5" />
                                <span>+{formatPct(model.pred7d)}%</span>
                              </>
                            ) : (
                              <>
                                <ArrowDown className="w-3.5 h-3.5" />
                                <span>{formatPct(model.pred7d)}%</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-2">
                        {isPredictionValid(model.pred15d) ? (
                          <div className={`flex items-center gap-1 ${model.pred15d! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {model.pred15d! >= 0 ? (
                              <>
                                <ArrowUp className="w-3.5 h-3.5" />
                                <span>+{formatPct(model.pred15d)}%</span>
                              </>
                            ) : (
                              <>
                                <ArrowDown className="w-3.5 h-3.5" />
                                <span>{formatPct(model.pred15d)}%</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="py-4 px-2">
                        {isPredictionValid(model.pred30d) ? (
                          <div className={`flex items-center gap-1 ${model.pred30d! >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {model.pred30d! >= 0 ? (
                              <>
                                <ArrowUp className="w-3.5 h-3.5" />
                                <span>+{formatPct(model.pred30d)}%</span>
                              </>
                            ) : (
                              <>
                                <ArrowDown className="w-3.5 h-3.5" />
                                <span>{formatPct(model.pred30d)}%</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>


                      {/* View Button */}
                      <td className="py-4 px-2">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 cursor-pointer h-8 px-3"
                          onClick={() => handleViewClick(model)}
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}

                  {/* Error State - Still show table structure */}
                  {viewState === 'error' && (
                    <tr>
                      <td colSpan={9} className="text-center py-16">
                        <p className="text-gray-500">Unable to load model data</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>

      {/* Evaluation Plot Modal */}
      <Dialog open={selectedModel !== null} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              {selectedModel?.ticker} – Model Evaluation
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Evaluation plot from S3 */}
            <div className="bg-gray-100 rounded-lg flex flex-col items-center justify-center min-h-[400px] border border-gray-200 overflow-hidden">
              {imageLoading && (
                <div className="flex flex-col items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <p className="text-sm text-gray-500">Loading evaluation plot...</p>
                </div>
              )}
              
              {imageError && (
                <div className="flex flex-col items-center gap-4 p-8">
                  <BarChart3 className="w-16 h-16 text-gray-400" />
                  <p className="text-gray-700">Failed to load evaluation plot</p>
                  <p className="text-sm text-gray-500 text-center max-w-md">
                    The image could not be loaded from the server.
                  </p>
                </div>
              )}
              
              {selectedModel && (
                <img
                  src={selectedModel.plotUrl}
                  alt={`${selectedModel.ticker} evaluation plot`}
                  className={`max-w-full max-h-[500px] object-contain ${imageLoading || imageError ? 'hidden' : ''}`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                />
              )}
            </div>

            {/* Helper text */}
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Shows historical vs predicted prices.</p>
              <p>• Includes key metrics overlay (e.g. MAPE per horizon).</p>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={handleCloseModal}
                className="cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}