import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { Alert, AlertDescription } from "../ui/alert";
import {
  TrendingUp,
  TrendingDown,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  AlertCircle,
} from "lucide-react";
import {
  getTopPicks as fetchTopPicks,
  getMyList as fetchMyList,
  getMarketTable,
  type TopPick,
  type MyListItem,
  type MarketTableItem,
  StocksApiError,
} from "../../api/stocksApi";

type SortField =
  | "change_7d"
  | "change_15d"
  | "change_30d"
  | "predicted_change_7d"
  | "price";
type SortDirection = "asc" | "desc";

interface StockData {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  pctChange: {
    "7d": { actualPct: number; actualPrice: number };
    "15d": { actualPct: number; actualPrice: number };
    "30d": { actualPct: number; actualPrice: number };
  };
  predictedPctChange: {
    "7d": { predictedPct: number; predictedPrice: number };
  };
  sparkline14d: Array<{ date: string; price: number; isPredicted: boolean }>;
}

export function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [showMyListOnly, setShowMyListOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>("change_7d");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTopPicks, setIsLoadingTopPicks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTopPicksTab, setActiveTopPicksTab] = useState<
    "should_buy" | "should_sell" | "my_list"
  >("should_buy");

  // State for API data
  const [topPicksBuy, setTopPicksBuy] = useState<TopPick[]>([]);
  const [topPicksSell, setTopPicksSell] = useState<TopPick[]>([]);
  const [myList, setMyList] = useState<MyListItem[]>([]);
  const [marketTableData, setMarketTableData] = useState<MarketTableItem[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [myListSymbols, setMyListSymbols] = useState<string[]>([]);

  // Fetch top picks data
  useEffect(() => {
    const fetchTopPicksData = async () => {
      setIsLoadingTopPicks(true);
      try {
        const [buyData, sellData] = await Promise.all([
          fetchTopPicks("should_buy", 5, 7),
          fetchTopPicks("should_sell", 5, 7),
        ]);
        setTopPicksBuy(buyData);
        setTopPicksSell(sellData);
      } catch (err) {
        if (err instanceof StocksApiError) {
          console.error("Failed to fetch top picks:", err.message);
        }
      } finally {
        setIsLoadingTopPicks(false);
      }
    };

    fetchTopPicksData();
  }, []);

  // Fetch my list data
  useEffect(() => {
    const fetchMyListData = async () => {
      try {
        const data = await fetchMyList(5, 7);
        setMyList(data);
        setMyListSymbols(data.map((item) => item.ticker));
      } catch (err) {
        if (err instanceof StocksApiError) {
          console.error("Failed to fetch my list:", err.message);
          // If 401, user might not be authenticated or list is empty
          if (err.status !== 401) {
            setError("Failed to load your saved stocks");
          }
        }
      }
    };

    fetchMyListData();
  }, []);

  // Fetch market table data
  useEffect(() => {
    const fetchMarketTable = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getMarketTable({
          search: searchQuery || undefined,
          sector: selectedSector !== "all" ? selectedSector : undefined,
          sortBy: sortField,
          sortDir: sortDirection,
          pageSize: 100, // Get more items for client-side filtering
        });
        setMarketTableData(response.data);
        setSectors(response.meta.sectors);
      } catch (err) {
        if (err instanceof StocksApiError) {
          setError(err.message || "Failed to load market data");
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketTable();
  }, [searchQuery, selectedSector, sortField, sortDirection]);

  // Get top picks based on active tab
  const getTopPicks = (): (TopPick | MyListItem)[] => {
    if (activeTopPicksTab === "should_buy") {
      return topPicksBuy;
    } else if (activeTopPicksTab === "should_sell") {
      return topPicksSell;
    } else {
      return myList;
    }
  };

  const topPicks = getTopPicks();

  // Filter market data (client-side filtering for my list only, rest is server-side)
  const filteredAndSortedStocks = marketTableData.filter((stock) => {
    // My list filter (client-side only)
    if (showMyListOnly && !myListSymbols.includes(stock.symbol)) {
      return false;
    }
    return true;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const renderSparkline = (data: Array<{ price: number; isPredicted?: boolean }>) => {
    const prices = data.map((d) => d.price);
    const max = Math.max(...prices);
    const min = Math.min(...prices);
    const range = max - min || 1;
    const width = 60;
    const height = 20;

    // Separate actual and predicted points
    const actualPoints: Array<{ x: number; y: number; price: number }> = [];
    const predictedPoints: Array<{ x: number; y: number; price: number }> = [];

    prices.forEach((value, i) => {
      const x = (i / (prices.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      const point = { x, y, price: value };
      
      if (data[i]?.isPredicted) {
        predictedPoints.push(point);
      } else {
        actualPoints.push(point);
      }
    });

    // Convert points to polyline string format
    const actualPolyline = actualPoints.map((p) => `${p.x},${p.y}`).join(" ");
    const predictedPolyline = predictedPoints.map((p) => `${p.x},${p.y}`).join(" ");

    // Determine color based on overall trend
    const isPositive = prices[prices.length - 1] >= prices[0];
    const actualColor = isPositive ? "#3b82f6" : "#dc2626"; // Blue for actual
    const predictedColor = isPositive ? "#16a34a" : "#ef4444"; // Green/red for predicted

    return (
      <svg width={width} height={height} className="inline-block">
        {/* Actual prices line */}
        {actualPolyline && (
          <polyline
            points={actualPolyline}
            fill="none"
            stroke={actualColor}
            strokeWidth="1.5"
          />
        )}
        {/* Predicted prices line */}
        {predictedPolyline && (
          <polyline
            points={predictedPolyline}
            fill="none"
            stroke={predictedColor}
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
        )}
      </svg>
    );
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const formatPercentage = (pct: number) => {
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
  };

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={() => setError(null)}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      {/* Top Picks Card */}
      <Card className="p-4">
        <Tabs value={activeTopPicksTab} onValueChange={(v) => setActiveTopPicksTab(v as any)}>
          <TabsList>
            <TabsTrigger value="should_buy">Should Buy</TabsTrigger>
            <TabsTrigger value="should_sell">Should Sell</TabsTrigger>
            <TabsTrigger value="my_list">My List</TabsTrigger>
          </TabsList>

          <TabsContent value="should_buy" className="mt-4">
            {isLoadingTopPicks ? (
              <div className="flex gap-3 flex-wrap">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-32" />
                ))}
              </div>
            ) : topPicks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No stocks found
              </div>
            ) : (
              <div className="flex gap-3 flex-wrap">
                {topPicks.map((stock) => {
                  const ticker = stock.ticker;
                  const predictedPct = stock.predictedChangePct;
                  return (
                    <div
                      key={ticker}
                      className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                      onClick={() => navigate(`/stock-detail/${ticker}`)}
                    >
                      <span className="text-gray-900">{ticker}</span>
                      <div className="flex items-center gap-1 text-green-700">
                        <TrendingUp className="w-4 h-4" />
                        <span>{formatPercentage(predictedPct)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="should_sell" className="mt-4">
            {isLoadingTopPicks ? (
              <div className="flex gap-3 flex-wrap">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-32" />
                ))}
              </div>
            ) : topPicks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No stocks found
              </div>
            ) : (
              <div className="flex gap-3 flex-wrap">
                {topPicks.map((stock) => {
                  const ticker = stock.ticker;
                  const predictedPct = stock.predictedChangePct;
                  return (
                    <div
                      key={ticker}
                      className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                      onClick={() => navigate(`/stock-detail/${ticker}`)}
                    >
                      <span className="text-gray-900">{ticker}</span>
                      <div className="flex items-center gap-1 text-red-700">
                        <TrendingDown className="w-4 h-4" />
                        <span>{formatPercentage(predictedPct)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my_list" className="mt-4">
            {isLoadingTopPicks ? (
              <div className="flex gap-3 flex-wrap">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-32" />
                ))}
              </div>
            ) : topPicks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Your list is empty. Add stocks to track them here.
              </div>
            ) : (
              <div className="flex gap-3 flex-wrap">
                {topPicks.map((stock) => {
                  const ticker = stock.ticker;
                  const predictedPct = stock.predictedChangePct;
                  return (
                    <div
                      key={ticker}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                      onClick={() => navigate(`/stock-detail/${ticker}`)}
                    >
                      <span className="text-gray-900">{ticker}</span>
                      <div
                        className={`flex items-center gap-1 ${
                          predictedPct >= 0 ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {predictedPct >= 0 ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        <span>{formatPercentage(predictedPct)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Market Table Card */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Header Controls */}
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by symbol or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedSector} onValueChange={setSelectedSector}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sectors</SelectItem>
                {sectors.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant={showMyListOnly ? "default" : "outline"}
              onClick={() => setShowMyListOnly(!showMyListOnly)}
            >
              My List
            </Button>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredAndSortedStocks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">No stocks match your filters</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSector("all");
                  setShowMyListOnly(false);
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">
                      <button
                        className="flex items-center gap-1 hover:text-gray-900"
                        onClick={() => handleSort("price")}
                      >
                        Current Price
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        className="flex items-center gap-1 hover:text-gray-900"
                        onClick={() => handleSort("change_7d")}
                      >
                        % Change 7D IRL
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        className="flex items-center gap-1 hover:text-gray-900"
                        onClick={() => handleSort("change_15d")}
                      >
                        % Change 15D IRL
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        className="flex items-center gap-1 hover:text-gray-900"
                        onClick={() => handleSort("change_30d")}
                      >
                        % Change 30D IRL
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        className="flex items-center gap-1 hover:text-gray-900"
                        onClick={() => handleSort("predicted_change_7d")}
                      >
                        % Change 7D Predicted
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">14D Sparkline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedStocks.map((stock) => (
                    <TableRow
                      key={stock.symbol}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/stock-detail/${stock.symbol}`)}
                    >
                      <TableCell>
                        <div className="text-gray-900">{stock.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-gray-900 font-medium">
                          {stock.symbol}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-gray-900">
                        {stock.currentPrice ? formatPrice(stock.currentPrice) : "—"}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm ${
                          (stock.pctChange["7d"]?.actualPct ?? 0) >= 0
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {stock.pctChange["7d"] ? (
                          <>
                            <div>
                              {formatPercentage(stock.pctChange["7d"].actualPct ?? 0)}
                            </div>
                            {stock.pctChange["7d"].actualPrice && (
                              <div className="text-xs text-gray-500">
                                / {formatPrice(stock.pctChange["7d"].actualPrice)}
                              </div>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm ${
                          (stock.pctChange["15d"]?.actualPct ?? 0) >= 0
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {stock.pctChange["15d"] ? (
                          <>
                            <div>
                              {formatPercentage(stock.pctChange["15d"].actualPct ?? 0)}
                            </div>
                            {stock.pctChange["15d"].actualPrice && (
                              <div className="text-xs text-gray-500">
                                / {formatPrice(stock.pctChange["15d"].actualPrice)}
                              </div>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm ${
                          (stock.pctChange["30d"]?.actualPct ?? 0) >= 0
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {stock.pctChange["30d"] ? (
                          <>
                            <div>
                              {formatPercentage(stock.pctChange["30d"].actualPct ?? 0)}
                            </div>
                            {stock.pctChange["30d"].actualPrice && (
                              <div className="text-xs text-gray-500">
                                / {formatPrice(stock.pctChange["30d"].actualPrice)}
                              </div>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {stock.predictedPctChange?.["7d"]?.predictedPct !== null &&
                        stock.predictedPctChange?.["7d"]?.predictedPct !== undefined ? (
                          <div className="flex flex-col">
                            <span
                              className={
                                (stock.predictedPctChange?.["7d"]?.predictedPct ?? 0) >= 0
                                  ? "text-green-700"
                                  : "text-red-700"
                              }
                            >
                              {formatPercentage(stock.predictedPctChange?.["7d"]?.predictedPct!)}
                            </span>
                            {stock.predictedPctChange?.["7d"]?.predictedPrice !== null &&
                            stock.predictedPctChange?.["7d"]?.predictedPrice !== undefined ? (
                              <span className="text-xs text-gray-500 mt-0.5">
                                {formatPrice(stock.predictedPctChange?.["7d"]?.predictedPrice!)}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {stock.sparkline14d && stock.sparkline14d.length > 0
                          ? renderSparkline(stock.sparkline14d)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
