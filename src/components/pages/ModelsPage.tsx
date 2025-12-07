import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';
import { ArrowUp, ArrowDown, BarChart3 } from 'lucide-react';

// Mock data for VN30 stocks - limited to 10 tickers
const vn30Companies = [
  { ticker: 'FPT', name: 'FPT Corporation' },
  { ticker: 'VCB', name: 'Vietcombank' },
  { ticker: 'VNM', name: 'Vinamilk' },
  { ticker: 'HPG', name: 'Hoa Phat Group' },
  { ticker: 'VIC', name: 'Vingroup' },
  { ticker: 'VHM', name: 'Vinhomes' },
  { ticker: 'MSN', name: 'Masan Group' },
  { ticker: 'SAB', name: 'Sabeco' },
  { ticker: 'TCB', name: 'Techcombank' },
  { ticker: 'GAS', name: 'PetroVietnam Gas' },
];

interface ModelData {
  ticker: string;
  companyName: string;
  lastTrained: string;
  mape7d: number;
  mape15d: number;
  mape30d: number;
  pred7d: number;
  pred15d: number;
  pred30d: number;
}

// Generate mock model data for the 10 tickers
const generateMockData = (): ModelData[] => {
  // Predefined realistic data for each ticker
  const tickerData = {
    'FPT': { lastTrained: '2 days ago', mape7d: 3.2, mape15d: 4.1, mape30d: 5.8, pred7d: 4.2, pred15d: 6.8, pred30d: 9.1 },
    'VCB': { lastTrained: '1 day ago', mape7d: 2.8, mape15d: 3.5, mape30d: 4.9, pred7d: 3.5, pred15d: 5.2, pred30d: 7.8 },
    'VNM': { lastTrained: '3 days ago', mape7d: 4.2, mape15d: 5.8, mape30d: 7.2, pred7d: -1.2, pred15d: -2.4, pred30d: -3.1 },
    'HPG': { lastTrained: '5 hours ago', mape7d: 5.6, mape15d: 7.3, mape30d: 9.8, pred7d: 6.5, pred15d: 8.2, pred30d: 11.3 },
    'VIC': { lastTrained: '2 days ago', mape7d: 6.8, mape15d: 8.9, mape30d: 11.2, pred7d: 2.8, pred15d: 4.1, pred30d: 5.9 },
    'VHM': { lastTrained: '1 week ago', mape7d: 7.2, mape15d: 9.5, mape30d: 12.3, pred7d: -2.3, pred15d: -4.6, pred30d: -6.8 },
    'MSN': { lastTrained: '5 days ago', mape7d: 4.8, mape15d: 6.2, mape30d: 8.5, pred7d: 5.1, pred15d: 7.3, pred30d: 10.2 },
    'SAB': { lastTrained: '3 days ago', mape7d: 3.5, mape15d: 4.7, mape30d: 6.1, pred7d: 1.8, pred15d: 2.9, pred30d: 4.2 },
    'TCB': { lastTrained: '2 hours ago', mape7d: 2.9, mape15d: 3.8, mape30d: 5.2, pred7d: 4.7, pred15d: 6.9, pred30d: 9.5 },
    'GAS': { lastTrained: '1 day ago', mape7d: 4.1, mape15d: 5.5, mape30d: 7.8, pred7d: -1.5, pred15d: -2.8, pred30d: -4.2 },
  };

  return vn30Companies.map(({ ticker, name }) => ({
    ticker,
    companyName: name,
    ...tickerData[ticker as keyof typeof tickerData],
  }));
};

// Get MAPE color based on value
const getMapeColor = (value: number): string => {
  if (value < 5) return 'text-green-600';
  if (value <= 10) return 'text-yellow-600';
  return 'text-red-600';
};

const getMapeBackgroundColor = (value: number): string => {
  if (value < 5) return 'bg-green-100';
  if (value <= 10) return 'bg-yellow-100';
  return 'bg-red-100';
};

const getMapeBorderColor = (value: number): string => {
  if (value < 5) return 'border-green-200';
  if (value <= 10) return 'border-yellow-200';
  return 'border-red-200';
};

type ViewState = 'loading' | 'error' | 'empty' | 'default';

export function ModelsPage() {
  const [viewState, setViewState] = useState<ViewState>('default');
  const [modelData] = useState<ModelData[]>(generateMockData());
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);

  const handleViewClick = (ticker: string) => {
    setSelectedTicker(ticker);
  };

  const handleCloseModal = () => {
    setSelectedTicker(null);
  };

  const handleRetry = () => {
    setViewState('loading');
    setTimeout(() => {
      setViewState('default');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-8 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-gray-900 mb-2">Models Overview</h1>
          <p className="text-gray-600">Performance and predictions for trained VN30 models</p>
        </div>

        {/* Demo State Controls (can be removed in production) */}
        <Card className="p-3 mb-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-900">Demo:</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewState === 'default' ? 'default' : 'outline'}
                onClick={() => setViewState('default')}
                className="cursor-pointer h-8"
              >
                Default
              </Button>
              <Button
                size="sm"
                variant={viewState === 'loading' ? 'default' : 'outline'}
                onClick={() => setViewState('loading')}
                className="cursor-pointer h-8"
              >
                Loading
              </Button>
              <Button
                size="sm"
                variant={viewState === 'empty' ? 'default' : 'outline'}
                onClick={() => setViewState('empty')}
                className="cursor-pointer h-8"
              >
                Empty
              </Button>
              <Button
                size="sm"
                variant={viewState === 'error' ? 'default' : 'outline'}
                onClick={() => setViewState('error')}
                className="cursor-pointer h-8"
              >
                Error
              </Button>
            </div>
          </div>
        </Card>

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
                          {model.mape7d}%
                        </Badge>
                      </td>
                      <td className="py-4 px-2">
                        <Badge
                          className={`${getMapeBackgroundColor(model.mape15d)} ${getMapeColor(model.mape15d)} ${getMapeBorderColor(model.mape15d)}`}
                        >
                          {model.mape15d}%
                        </Badge>
                      </td>
                      <td className="py-4 px-2">
                        <Badge
                          className={`${getMapeBackgroundColor(model.mape30d)} ${getMapeColor(model.mape30d)} ${getMapeBorderColor(model.mape30d)}`}
                        >
                          {model.mape30d}%
                        </Badge>
                      </td>

                      {/* Prediction Columns with arrows */}
                      <td className="py-4 px-2">
                        <div className={`flex items-center gap-1 ${model.pred7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {model.pred7d >= 0 ? (
                            <>
                              <ArrowUp className="w-3.5 h-3.5" />
                              <span>+{model.pred7d}%</span>
                            </>
                          ) : (
                            <>
                              <ArrowDown className="w-3.5 h-3.5" />
                              <span>{model.pred7d}%</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className={`flex items-center gap-1 ${model.pred15d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {model.pred15d >= 0 ? (
                            <>
                              <ArrowUp className="w-3.5 h-3.5" />
                              <span>+{model.pred15d}%</span>
                            </>
                          ) : (
                            <>
                              <ArrowDown className="w-3.5 h-3.5" />
                              <span>{model.pred15d}%</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-2">
                        <div className={`flex items-center gap-1 ${model.pred30d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {model.pred30d >= 0 ? (
                            <>
                              <ArrowUp className="w-3.5 h-3.5" />
                              <span>+{model.pred30d}%</span>
                            </>
                          ) : (
                            <>
                              <ArrowDown className="w-3.5 h-3.5" />
                              <span>{model.pred30d}%</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* View Button */}
                      <td className="py-4 px-2">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 cursor-pointer h-8 px-3"
                          onClick={() => handleViewClick(model.ticker)}
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
      <Dialog open={selectedTicker !== null} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-8">
              {selectedTicker} – Model Evaluation
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Placeholder for evaluation plot */}
            <div className="bg-gray-100 rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-gray-300">
              <BarChart3 className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-700 mb-2">
                {selectedTicker}_evaluation.png from S3
              </p>
              <p className="text-sm text-gray-500 text-center max-w-md">
                (Actual vs predicted prices with metrics overlay)
              </p>
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