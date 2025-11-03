import { useState } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { TrendingUp, TrendingDown, Building2, ExternalLink } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StockDetailPageProps {
  ticker: string;
  onNavigateHome: () => void;
}

const stockInfo: Record<string, any> = {
  FPT: {
    name: 'FPT Corporation',
    description: 'Leading Vietnamese technology and telecommunications company providing IT services, telecommunications, and technology products.',
    marketCap: '72,450 billion VND',
    volume: '2.4M shares',
    sector: 'Technology',
    exchange: 'HOSE',
    predictions: {
      '3d': 2.1,
      '7d': 4.2,
      '15d': 6.8,
      '30d': 8.5,
    },
  },
  VNM: {
    name: 'Vinamilk',
    description: 'Vietnam\'s largest dairy company, producing milk and dairy products with leading market position in Southeast Asia.',
    marketCap: '128,600 billion VND',
    volume: '1.8M shares',
    sector: 'Consumer Goods',
    exchange: 'HOSE',
    predictions: {
      '3d': 1.8,
      '7d': 3.8,
      '15d': 5.2,
      '30d': 7.1,
    },
  },
  VCB: {
    name: 'Vietcombank',
    description: 'One of Vietnam\'s largest commercial banks offering comprehensive banking and financial services nationwide.',
    marketCap: '445,200 billion VND',
    volume: '3.1M shares',
    sector: 'Banking',
    exchange: 'HOSE',
    predictions: {
      '3d': 1.5,
      '7d': 3.5,
      '15d': 5.8,
      '30d': 7.9,
    },
  },
  HPG: {
    name: 'Hoa Phat Group',
    description: 'Vietnam\'s largest steel producer and construction materials manufacturer with expanding domestic and export markets.',
    marketCap: '156,800 billion VND',
    volume: '4.2M shares',
    sector: 'Materials',
    exchange: 'HOSE',
    predictions: {
      '3d': 1.2,
      '7d': 2.9,
      '15d': 4.5,
      '30d': 6.2,
    },
  },
  MSN: {
    name: 'Masan Group',
    description: 'Leading consumer-retail corporation in Vietnam operating brands in consumer goods, retail, and financial services.',
    marketCap: '98,300 billion VND',
    volume: '2.9M shares',
    sector: 'Consumer Goods',
    exchange: 'HOSE',
    predictions: {
      '3d': -1.8,
      '7d': -3.1,
      '15d': -2.5,
      '30d': -1.2,
    },
  },
  VIC: {
    name: 'Vingroup',
    description: 'Vietnam\'s largest private conglomerate with businesses in real estate, retail, healthcare, education, and technology.',
    marketCap: '238,500 billion VND',
    volume: '5.6M shares',
    sector: 'Real Estate',
    exchange: 'HOSE',
    predictions: {
      '3d': 1.0,
      '7d': 2.4,
      '15d': 3.8,
      '30d': 5.5,
    },
  },
  MWG: {
    name: 'Mobile World',
    description: 'Leading electronics and mobile device retailer in Vietnam operating Mobile World and Dien May Xanh chains.',
    marketCap: '54,200 billion VND',
    volume: '3.8M shares',
    sector: 'Retail',
    exchange: 'HOSE',
    predictions: {
      '3d': -1.2,
      '7d': -2.7,
      '15d': -2.1,
      '30d': -0.8,
    },
  },
  VHM: {
    name: 'Vinhomes',
    description: 'Vietnam\'s largest real estate developer focused on large-scale residential and commercial property projects.',
    marketCap: '187,900 billion VND',
    volume: '2.5M shares',
    sector: 'Real Estate',
    exchange: 'HOSE',
    predictions: {
      '3d': -0.8,
      '7d': -1.9,
      '15d': -1.2,
      '30d': 0.5,
    },
  },
};

export function StockDetailPage({ ticker, onNavigateHome }: StockDetailPageProps) {
  const [selectedRange, setSelectedRange] = useState<'3d' | '7d' | '15d' | '30d'>('7d');
  const stock = stockInfo[ticker] || stockInfo.FPT;

  // Generate chart data based on selected range
  const generateChartData = (range: '3d' | '7d' | '15d' | '30d') => {
    const dataPoints = range === '3d' ? 3 : range === '7d' ? 7 : range === '15d' ? 15 : 30;
    const basePrice = 100;
    const targetChange = stock.predictions[range];
    
    const data = [];
    for (let i = 0; i <= dataPoints; i++) {
      const progress = i / dataPoints;
      const volatility = Math.sin(i * 0.5) * 2;
      const trend = (targetChange / 100) * basePrice * progress;
      const actualPrice = basePrice + trend + volatility;
      const predictedPrice = basePrice + (targetChange / 100) * basePrice * progress;

      const date = new Date();
      date.setDate(date.getDate() - (dataPoints - i));

      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        actual: i <= dataPoints - 1 ? Number(actualPrice.toFixed(2)) : null,
        predicted: i >= Math.floor(dataPoints * 0.7) ? Number(predictedPrice.toFixed(2)) : null,
      });
    }
    return data;
  };

  const chartData = generateChartData(selectedRange);

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      {/* Three Column Layout */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Panel - Predictions (3 columns) */}
        <div className="col-span-3">
          <Card className="p-4">
            <h3 className="mb-4">Predicted Change</h3>
            <div className="space-y-3">
              {Object.entries(stock.predictions).map(([period, change]: [string, any]) => {
                const isPositive = change >= 0;
                return (
                  <div
                    key={period}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span className="text-gray-700">{period.toUpperCase()}</span>
                    <Badge
                      variant="secondary"
                      className={`${
                        isPositive
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-red-100 text-red-700 border-red-200'
                      } flex items-center gap-1`}
                    >
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>
                        {isPositive ? '+' : ''}
                        {change}%
                      </span>
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Center Panel - Chart (6 columns) */}
        <div className="col-span-6">
          <Card className="p-4">
            <div className="mb-4">
              <h3 className="mb-3">Price & Forecast</h3>
              <Tabs value={selectedRange} onValueChange={(v) => setSelectedRange(v as any)}>
                <TabsList>
                  <TabsTrigger value="3d">3D</TabsTrigger>
                  <TabsTrigger value="7d">7D</TabsTrigger>
                  <TabsTrigger value="15d">15D</TabsTrigger>
                  <TabsTrigger value="30d">30D</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '14px' }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Actual Price"
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#16a34a"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Predicted"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Right Panel - Overview (3 columns) */}
        <div className="col-span-3">
          <Card className="p-4">
            <div className="mb-4">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                <Building2 className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="mb-1">{stock.name}</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {stock.description}
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <span className="text-sm text-gray-500">Market Cap</span>
                <p className="text-gray-900">{stock.marketCap}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Trading Volume</span>
                <p className="text-gray-900">{stock.volume}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Sector</span>
                <p className="text-gray-900">{stock.sector}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Exchange</span>
                <p className="text-gray-900">{stock.exchange}</p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-gray-200">
              <a
                href="#"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                onClick={(e) => e.preventDefault()}
              >
                <ExternalLink className="w-4 h-4" />
                Financial report
              </a>
              <a
                href="#"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                onClick={(e) => e.preventDefault()}
              >
                <ExternalLink className="w-4 h-4" />
                Company website
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
