import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  ExternalLink,
  Star,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Skeleton } from "../ui/skeleton";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertCircle } from "lucide-react";
import {
  getStockDetail,
  getStockPredictions,
  getStockChart,
  getModelStatus,
  getMyList,
  addToMyList,
  removeFromMyList,
  getMarketTable,
  type StockDetail,
  type StockPredictions,
  type ChartData,
  type ChartPoint,
  type ModelStatus,
  type HorizonMetric,
  StocksApiError,
} from "../../api/stocksApi";

export function StockDetailPage() {
  const { ticker: tickerParam } = useParams<{ ticker?: string }>();
  const navigate = useNavigate();
  const [currentTicker, setCurrentTicker] = useState<string | null>(tickerParam || null);
  const [selectedRange, setSelectedRange] = useState<"7d" | "15d" | "30d">("7d");
  const [selectedHistoricalRange, setSelectedHistoricalRange] = useState<"15d" | "30d" | "60d" | "90d">("30d");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // API data state
  const [stockDetail, setStockDetail] = useState<StockDetail | null>(null);
  const [predictions, setPredictions] = useState<StockPredictions | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [isInMyList, setIsInMyList] = useState<boolean>(false);
  const [isTogglingMyList, setIsTogglingMyList] = useState<boolean>(false);

  // Fetch first stock from market table if no ticker provided
  useEffect(() => {
    const fetchFirstStock = async () => {
      if (!tickerParam) {
        setIsLoading(true);
        try {
          const marketData = await getMarketTable({ page: 1, pageSize: 1 });
          if (marketData.data && marketData.data.length > 0) {
            const firstStockTicker = marketData.data[0].symbol;
            // Update URL to include the ticker first, then set currentTicker
            navigate(`/stock-detail/${firstStockTicker}`, { replace: true });
            // Don't set currentTicker here - let the next useEffect handle it when tickerParam updates
          } else {
            setError("No stocks available");
            setIsLoading(false);
          }
        } catch (err) {
          console.error("Failed to fetch stock list:", err);
          setError("Failed to load stock data");
          setIsLoading(false);
        }
      }
    };

    fetchFirstStock();
  }, [tickerParam, navigate]);

  // Update currentTicker when URL param changes
  useEffect(() => {
    if (tickerParam) {
      setCurrentTicker(tickerParam);
    } else {
      // If no ticker param, set to null and keep loading
      setCurrentTicker(null);
    }
  }, [tickerParam]);

  // Fetch all data when ticker changes
  useEffect(() => {
    if (!currentTicker) {
      return; // Wait for ticker to be determined
    }

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const [detail, preds, chart, status] = await Promise.all([
          getStockDetail(currentTicker),
          getStockPredictions(currentTicker, [7, 15, 30]),
          getStockChart(currentTicker, selectedHistoricalRange, selectedRange),
          getModelStatus(currentTicker),
        ]);
        
        setStockDetail(detail);
        setPredictions(preds);
        setChartData(chart);
        setModelStatus(status);
      } catch (err) {
        if (err instanceof StocksApiError) {
          setError(err.message || "Failed to load stock data");
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentTicker, selectedHistoricalRange, selectedRange]);

  // Note: Chart data is now fetched in the main fetchData useEffect above
  // No separate useEffect needed as it's handled by the main data fetch

  // Check if stock is in My List
  useEffect(() => {
    const checkMyListStatus = async () => {
      if (!currentTicker) return;
      
      try {
        const myList = await getMyList(20); // Get a large number to check if ticker is in list
        const isInList = myList.some((item) => item.ticker === currentTicker);
        setIsInMyList(isInList);
      } catch (err) {
        // If error, assume not in list
        setIsInMyList(false);
      }
    };

    checkMyListStatus();
  }, [currentTicker]);

  // Handle toggle My List
  const handleToggleMyList = async () => {
    if (!currentTicker || isTogglingMyList) return;
    
    // Optimistically update UI immediately for better UX
    const previousState = isInMyList;
    setIsInMyList(!previousState);
    setIsTogglingMyList(true);
    
    try {
      if (previousState) {
        await removeFromMyList(currentTicker);
      } else {
        await addToMyList(currentTicker);
      }
    } catch (err) {
      // Revert on error
      console.error("Failed to toggle My List:", err);
      setIsInMyList(previousState);
      // Optionally show an error message to user
    } finally {
      setIsTogglingMyList(false);
    }
  };

  const accuracyTarget = 5.0; // Target MAPE threshold

  // Format chart data for recharts
  // Identify which points are historical vs predicted for better visualization
  const formattedChartData = chartData?.points.map((point: ChartPoint) => {
    const isHistorical = point.actualPrice !== null && point.actualPrice !== undefined;
    const isPredicted = point.predictedPrice !== null && point.predictedPrice !== undefined;
    
    return {
      date: new Date(point.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      actual: point.actualPrice,
      predicted: point.predictedPrice,
      isHistorical,
      isPredicted,
      fullDate: point.date, // Keep original date for tooltip
    };
  }) || [];
  
  // Find the transition point (where historical ends and prediction begins)
  const transitionIndex = formattedChartData.findIndex(
    (point, index) => 
      point.isPredicted && 
      index > 0 && 
      formattedChartData[index - 1]?.isHistorical
  );
  
  // Connect the lines at transition point by ensuring both lines share the same value
  if (transitionIndex >= 0 && transitionIndex > 0) {
    const lastActualIndex = transitionIndex - 1;
    const firstPredictedIndex = transitionIndex;
    
    const lastActualPrice = formattedChartData[lastActualIndex]?.actual;
    const firstPredictedPrice = formattedChartData[firstPredictedIndex]?.predicted;
    
    if (lastActualPrice !== null && firstPredictedPrice !== null) {
      // At the transition point, set both actual and predicted to the last actual price
      // This creates a visual connection between the two lines
      formattedChartData[firstPredictedIndex] = {
        ...formattedChartData[firstPredictedIndex],
        actual: lastActualPrice,
        predicted: lastActualPrice,
      };
    }
  }

  // Format predictions for display (convert horizon keys to display format)
  const formattedPredictions = predictions
    ? Object.entries(predictions.horizons)
        .map(([horizon, data]) => {
          const predData = data as { predictedChangePct: number | null };
          return {
            horizon: `${horizon}d`,
            change: predData.predictedChangePct ?? 0,
          };
        })
        .filter((p) => ["7d", "15d", "30d"].includes(p.horizon))
        .sort((a, b) => {
          const order = { "7d": 1, "15d": 2, "30d": 3 };
          return (order[a.horizon as keyof typeof order] || 0) - (order[b.horizon as keyof typeof order] || 0);
        })
    : [];

  // Format model status
  const lastUpdated = modelStatus?.lastUpdatedAt
    ? new Date(modelStatus.lastUpdatedAt)
    : null;
  
  const formatMarketCap = (cap: number | null) => {
    if (!cap) return "—";
    return new Intl.NumberFormat("vi-VN", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(cap) + " billion VND";
  };

  const formatVolume = (volume: number | null) => {
    if (!volume) return "—";
    if (volume >= 1000000) {
      return (volume / 1000000).toFixed(1) + "M shares";
    }
    return new Intl.NumberFormat("vi-VN").format(volume) + " shares";
  };

  // Show loading if we don't have a ticker yet (fetching first stock)
  if (!tickerParam && !currentTicker && isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-gray-500">Loading stock data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <button
              onClick={() => window.location.reload()}
              className="ml-4 underline"
            >
              Retry
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading || !stockDetail || !predictions || !chartData || !modelStatus) {
    return (
      <div className="max-w-7xl mx-auto p-8 space-y-6">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-3 space-y-4">
            <Card className="p-4">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </Card>
            <Card className="p-4">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </Card>
          </div>
          <div className="col-span-6">
            <Card className="p-4">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-[300px] w-full" />
            </Card>
          </div>
          <div className="col-span-3">
            <Card className="p-4">
              <Skeleton className="h-12 w-12 mb-3" />
              <Skeleton className="h-6 w-48 mb-4" />
              <Skeleton className="h-20 w-full mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      {/* Three Column Layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Panel - Predictions (3 columns) */}
        <div className="col-span-3 space-y-4">
          <Card className="p-4">
            <h3 className="mb-4">Predicted Change</h3>
            <div className="space-y-3">
              {formattedPredictions.map((pred) => {
                const isPositive = pred.change >= 0;
                return (
                  <div
                    key={pred.horizon}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span className="text-gray-700">
                      {pred.horizon.toUpperCase()}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`${
                        isPositive
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-red-100 text-red-700 border-red-200"
                      } flex items-center gap-1`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>
                        {isPositive ? "+" : ""}
                        {pred.change.toFixed(1)}%
                      </span>
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Model Status Card */}
          <Card className="p-4">
            <div className="flex items-start justify-between mb-4">
              <h3>Model status</h3>
              {modelStatus && (
                <Badge
                  variant="outline"
                  className={`${
                    modelStatus.state === "fresh"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : modelStatus.state === "stable"
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                  } capitalize`}
                >
                  {modelStatus.state}
                </Badge>
              )}
            </div>

            <div className="space-y-3">
              {/* Last Updated Row */}
              <div className="flex items-start justify-between">
                <span className="text-sm text-gray-600">
                  Last updated
                </span>
                <div className="text-right">
                  {lastUpdated ? (
                    <>
                      <p className="text-sm text-gray-900">
                        {lastUpdated.toLocaleDateString("en-CA", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                        })}{" "}
                        {lastUpdated.toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}{" "}
                        ICT
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        From latest training run
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">—</p>
                  )}
                </div>
              </div>

              {/* Accuracy Row */}
              <div className="flex items-start justify-between">
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm text-gray-600 cursor-help border-b border-dashed border-gray-400">
                        MAPE (7D)
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Mean Absolute Percentage Error computed on latest backtest window.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="text-right space-y-2">
                  {modelStatus.metrics["7d"] ? (
                    <>
                      <p
                        className={`text-sm font-semibold ${
                          modelStatus.metrics["7d"].mapePct <= accuracyTarget
                            ? "text-green-700"
                            : modelStatus.metrics["7d"].mapePct <= accuracyTarget * 2
                              ? "text-yellow-700"
                              : "text-red-700"
                        }`}
                      >
                        {modelStatus.metrics["7d"].mapePct.toFixed(1)}%
                      </p>
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {Object.entries(modelStatus.metrics)
                          .filter(([h]) => h !== "7d")
                          .map(([horizon, metric]) => {
                            const metricData = metric as HorizonMetric;
                            return (
                              <Badge
                                key={horizon}
                                variant="outline"
                                className="text-xs bg-gray-50 text-gray-600 border-gray-300"
                              >
                                {horizon} {metricData.mapePct.toFixed(1)}%
                              </Badge>
                            );
                          })}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">—</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Center Panel - Chart (6 columns) */}
        <div className="col-span-6">
          <Card className="p-4">
            <div className="mb-4">
              <h3 className="mb-3">Price & Forecast</h3>
              <div className="flex items-end gap-6">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Historical Range</label>
                  <Tabs
                    value={selectedHistoricalRange}
                    onValueChange={(v) =>
                      setSelectedHistoricalRange(v as "15d" | "30d" | "60d" | "90d")
                    }
                  >
                    <TabsList>
                      <TabsTrigger value="15d">15D</TabsTrigger>
                      <TabsTrigger value="30d">30D</TabsTrigger>
                      <TabsTrigger value="60d">60D</TabsTrigger>
                      <TabsTrigger value="90d">90D</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Prediction Range</label>
                  <Tabs
                    value={selectedRange}
                    onValueChange={(v) =>
                      setSelectedRange(v as "7d" | "15d" | "30d")
                    }
                  >
                    <TabsList>
                      <TabsTrigger value="7d">7D</TabsTrigger>
                      <TabsTrigger value="15d">15D</TabsTrigger>
                      <TabsTrigger value="30d">30D</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formattedChartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                  domain={["auto", "auto"]}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    fontSize: "14px",
                  }}
                  formatter={(value: any, name: string) => {
                    if (value === null || value === undefined) return null;
                    return [value.toFixed(2), name];
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      const dataPoint = payload[0].payload;
                      const dateStr = dataPoint?.fullDate 
                        ? new Date(dataPoint.fullDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : label;
                      return dateStr;
                    }
                    return label;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "14px" }}
                  iconType="line"
                />
                {/* Visual separator line between historical and predicted data */}
                {transitionIndex >= 0 && formattedChartData[transitionIndex] && (
                  <ReferenceLine
                    x={formattedChartData[transitionIndex].date}
                    stroke="#9ca3af"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    label={{ value: "Today", position: "top", fill: "#6b7280", fontSize: 11 }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Actual Price"
                  connectNulls={true}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#16a34a"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Predicted"
                  connectNulls={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Right Panel - Overview (3 columns) */}
        <div className="col-span-3">
          <Card className="p-4">
            <div className="mb-4">
              <div className="flex items-start justify-between mb-3">
                {stockDetail.logoUrl ? (
                  <img
                    src={stockDetail.logoUrl}
                    alt={stockDetail.name}
                    className="w-12 h-12 rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-gray-600" />
                  </div>
                )}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleToggleMyList}
                        disabled={isTogglingMyList}
                        className={`p-1.5 rounded-md transition-all duration-200 ${
                          isTogglingMyList ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        } active:scale-90`}
                        aria-label={isInMyList ? "Remove from My List" : "Add to My List"}
                      >
                        <Star
                          className={`w-5 h-5 transition-all duration-200 ${
                            isInMyList 
                              ? "scale-110" 
                              : "scale-100"
                          }`}
                          style={{
                            fill: isInMyList ? "#eab308" : "none",
                            stroke: isInMyList ? "#ca8a04" : "#9ca3af",
                            strokeWidth: 2,
                          }}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isInMyList ? "Remove from My List" : "Add to My List"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <h3 className="mb-1">{stockDetail.name}</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {stockDetail.description || "No description available."}
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <span className="text-sm text-gray-500">
                  Market Cap
                </span>
                <p className="text-gray-900">
                  {formatMarketCap(stockDetail.marketCap)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">
                  Trading Volume
                </span>
                <p className="text-gray-900">
                  {formatVolume(stockDetail.tradingVolume)}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">
                  Sector
                </span>
                <p className="text-gray-900">
                  {stockDetail.sector || "—"}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">
                  Exchange
                </span>
                <p className="text-gray-900">
                  {stockDetail.exchange || "—"}
                </p>
              </div>
            </div>

            {stockDetail.links && (
              <div className="space-y-2 pt-4 border-t border-gray-200">
                {stockDetail.links.financialReportUrl && (
                  <a
                    href={stockDetail.links.financialReportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Financial report
                  </a>
                )}
                {stockDetail.links.companyWebsiteUrl && (
                  <a
                    href={stockDetail.links.companyWebsiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Company website
                  </a>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}