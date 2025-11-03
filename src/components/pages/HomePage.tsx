import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { TrendingUp, TrendingDown, Search, SlidersHorizontal } from 'lucide-react';

interface HomePageProps {
  onNavigateToStock: (ticker: string) => void;
}

export function HomePage({ onNavigateToStock }: HomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const topPicks = [
    { symbol: 'FPT', growth: 4.2 },
    { symbol: 'VNM', growth: 3.8 },
    { symbol: 'VCB', growth: 3.5 },
    { symbol: 'HPG', growth: 2.9 },
    { symbol: 'VIC', growth: 2.4 },
  ];

  const watchlist = [
    { symbol: 'MSN', growth: -3.1 },
    { symbol: 'MWG', growth: -2.7 },
    { symbol: 'VHM', growth: -1.9 },
  ];

  const marketData = [
    {
      symbol: 'FPT',
      name: 'FPT Corporation',
      price: '125,400',
      change1d: 2.1,
      change3d: 3.5,
      change7d: 4.2,
      sparkline: [98, 100, 102, 101, 103, 105, 104],
    },
    {
      symbol: 'VNM',
      name: 'Vinamilk',
      price: '68,200',
      change1d: 1.5,
      change3d: 2.8,
      change7d: 3.8,
      sparkline: [95, 97, 98, 99, 100, 102, 103],
    },
    {
      symbol: 'VCB',
      name: 'Vietcombank',
      price: '92,500',
      change1d: 0.8,
      change3d: 2.1,
      change7d: 3.5,
      sparkline: [96, 97, 98, 98, 99, 101, 103],
    },
    {
      symbol: 'HPG',
      name: 'Hoa Phat Group',
      price: '28,300',
      change1d: 1.2,
      change3d: 1.9,
      change7d: 2.9,
      sparkline: [97, 98, 98, 99, 100, 101, 102],
    },
    {
      symbol: 'MSN',
      name: 'Masan Group',
      price: '89,700',
      change1d: -1.5,
      change3d: -2.3,
      change7d: -3.1,
      sparkline: [104, 102, 101, 100, 99, 98, 96],
    },
    {
      symbol: 'VIC',
      name: 'Vingroup',
      price: '45,800',
      change1d: 0.5,
      change3d: 1.2,
      change7d: 2.4,
      sparkline: [97, 98, 99, 99, 100, 101, 102],
    },
    {
      symbol: 'MWG',
      name: 'Mobile World',
      price: '56,900',
      change1d: -0.8,
      change3d: -1.5,
      change7d: -2.7,
      sparkline: [103, 101, 100, 99, 98, 97, 97],
    },
    {
      symbol: 'VHM',
      name: 'Vinhomes',
      price: '72,100',
      change1d: -0.5,
      change3d: -1.2,
      change7d: -1.9,
      sparkline: [102, 101, 100, 99, 99, 98, 98],
    },
  ];

  const renderSparkline = (data: number[]) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const width = 60;
    const height = 20;

    const points = data
      .map((value, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');

    const isPositive = data[data.length - 1] >= data[0];

    return (
      <svg width={width} height={height} className="inline-block">
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? '#16a34a' : '#dc2626'}
          strokeWidth="1.5"
        />
      </svg>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      {/* Top Picks Card */}
      <Card className="p-4">
        <Tabs defaultValue="buy">
          <TabsList>
            <TabsTrigger value="buy">Should Buy</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="mt-4">
            <div className="flex gap-3 flex-wrap">
              {topPicks.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
                  onClick={() => onNavigateToStock(stock.symbol)}
                >
                  <span className="text-gray-900">{stock.symbol}</span>
                  <div className="flex items-center gap-1 text-green-700">
                    <TrendingUp className="w-4 h-4" />
                    <span>+{stock.growth}%</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="watchlist" className="mt-4">
            <div className="flex gap-3 flex-wrap">
              {watchlist.map((stock) => (
                <div
                  key={stock.symbol}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                  onClick={() => onNavigateToStock(stock.symbol)}
                >
                  <span className="text-gray-900">{stock.symbol}</span>
                  <div className="flex items-center gap-1 text-red-700">
                    <TrendingDown className="w-4 h-4" />
                    <span>{stock.growth}%</span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Market Table Card */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Header Controls */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name or symbol..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name/Symbol</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">% Change (1D)</TableHead>
                  <TableHead className="text-right">% Change (3D)</TableHead>
                  <TableHead className="text-right">% Change (7D)</TableHead>
                  <TableHead className="text-right">7D Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketData
                  .filter(
                    (stock) =>
                      searchQuery === '' ||
                      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((stock) => (
                    <TableRow
                      key={stock.symbol}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => onNavigateToStock(stock.symbol)}
                    >
                      <TableCell>
                        <div>
                          <div className="text-gray-900">{stock.symbol}</div>
                          <div className="text-sm text-gray-500">{stock.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-gray-900">
                        {stock.price}
                      </TableCell>
                      <TableCell
                        className={`text-right ${
                          stock.change1d >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {stock.change1d >= 0 ? '+' : ''}
                        {stock.change1d}%
                      </TableCell>
                      <TableCell
                        className={`text-right ${
                          stock.change3d >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {stock.change3d >= 0 ? '+' : ''}
                        {stock.change3d}%
                      </TableCell>
                      <TableCell
                        className={`text-right ${
                          stock.change7d >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {stock.change7d >= 0 ? '+' : ''}
                        {stock.change7d}%
                      </TableCell>
                      <TableCell className="text-right">
                        {renderSparkline(stock.sparkline)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
}
