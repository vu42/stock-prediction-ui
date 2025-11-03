import { Card } from './ui/card';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X } from 'lucide-react';

export function TrainingConfig() {
  const tickers = ['FPT', 'VCB', 'VNM', 'HPG', 'VIC', 'VHM', 'MSN', 'SAB', 'TCB', 'GAS'];

  return (
    <div className="space-y-4">
      {/* Stock Universe */}
      <Card className="p-4">
        <h3 className="mb-3">Stock Universe</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {tickers.map((ticker) => (
            <Badge key={ticker} variant="secondary" className="px-3 py-1.5 gap-1.5">
              {ticker}
              <X className="w-3 h-3 cursor-pointer hover:text-gray-900" />
            </Badge>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="vn30" />
          <label htmlFor="vn30" className="text-sm cursor-pointer">
            Use all VN30
          </label>
        </div>
      </Card>

      {/* Data Window */}
      <Card className="p-4">
        <h3 className="mb-3">Data Window</h3>
        <RadioGroup defaultValue="n-days" className="space-y-3 mb-3">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="n-days" id="n-days" />
            <Label htmlFor="n-days" className="cursor-pointer">Last N days</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="date-range" id="date-range" />
            <Label htmlFor="date-range" className="cursor-pointer">Date range</Label>
          </div>
        </RadioGroup>
        <div className="mb-3">
          <Label htmlFor="n-days-input" className="mb-1.5 block">N days</Label>
          <Input id="n-days-input" type="number" defaultValue="240" className="w-32" />
        </div>
        <div className="flex items-center space-x-2 mb-2">
          <Checkbox id="skip-refetch" />
          <label htmlFor="skip-refetch" className="text-sm cursor-pointer">
            Skip re-fetch (use DB)
          </label>
        </div>
        <p className="text-sm text-gray-500">
          Market calendar: VN; holidays handled automatically.
        </p>
      </Card>

      {/* Indicators */}
      <Card className="p-4">
        <h3 className="mb-3">Indicators</h3>
        <div className="space-y-4">
          {/* Price */}
          <div>
            <p className="mb-2 text-gray-700">Price</p>
            <div className="space-y-2 pl-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="sma" defaultChecked />
                <label htmlFor="sma" className="text-sm cursor-pointer">
                  SMA(5/20/60)
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="ema" defaultChecked />
                <label htmlFor="ema" className="text-sm cursor-pointer">
                  EMA(12/26)
                </label>
              </div>
            </div>
          </div>

          {/* Momentum */}
          <div>
            <p className="mb-2 text-gray-700">Momentum</p>
            <div className="space-y-2 pl-2">
              <div className="flex items-center gap-2">
                <Checkbox id="rsi" defaultChecked />
                <label htmlFor="rsi" className="text-sm cursor-pointer">RSI</label>
                <span className="text-sm text-gray-500">window</span>
                <Input type="number" defaultValue="14" className="w-16 h-7 px-2 text-sm" />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="roc" />
                <label htmlFor="roc" className="text-sm cursor-pointer">
                  ROC
                </label>
              </div>
            </div>
          </div>

          {/* Volatility */}
          <div>
            <p className="mb-2 text-gray-700">Volatility</p>
            <div className="space-y-2 pl-2">
              <div className="flex items-center gap-2">
                <Checkbox id="bollinger" defaultChecked />
                <label htmlFor="bollinger" className="text-sm cursor-pointer">Bollinger</label>
                <span className="text-sm text-gray-500">window</span>
                <Input type="number" defaultValue="20" className="w-16 h-7 px-2 text-sm" />
                <span className="text-sm text-gray-500">σ</span>
                <Input type="number" defaultValue="2.0" step="0.1" className="w-16 h-7 px-2 text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="atr" defaultChecked />
                <label htmlFor="atr" className="text-sm cursor-pointer">ATR</label>
                <span className="text-sm text-gray-500">window</span>
                <Input type="number" defaultValue="14" className="w-16 h-7 px-2 text-sm" />
              </div>
            </div>
          </div>

          {/* Volume */}
          <div>
            <p className="mb-2 text-gray-700">Volume</p>
            <div className="pl-2">
              <div className="flex items-center gap-2">
                <Checkbox id="volume-ma" defaultChecked />
                <label htmlFor="volume-ma" className="text-sm cursor-pointer">Volume MA</label>
                <span className="text-sm text-gray-500">window</span>
                <Input type="number" defaultValue="20" className="w-16 h-7 px-2 text-sm" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 mt-4 pt-3 border-t">
          <Checkbox id="leakage-guard" />
          <label htmlFor="leakage-guard" className="text-sm cursor-pointer">
            Leakage guard (enforce t−1 or earlier features)
          </label>
        </div>
      </Card>

      {/* Target & Splits */}
      <Card className="p-4">
        <h3 className="mb-3">Target & Splits</h3>
        <div className="mb-4">
          <Label className="mb-2 block">Horizons</Label>
          <div className="flex gap-2">
            <Badge variant="default" className="px-3 py-1.5">3d</Badge>
            <Badge variant="default" className="px-3 py-1.5">7d</Badge>
            <Badge variant="default" className="px-3 py-1.5">15d</Badge>
            <Badge variant="default" className="px-3 py-1.5">30d</Badge>
          </div>
        </div>
        <div className="mb-4">
          <Label htmlFor="lookback" className="mb-1.5 block">Lookback window</Label>
          <Input id="lookback" type="number" defaultValue="60" className="w-32" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="train-split" className="mb-1.5 block">Train %</Label>
            <Input id="train-split" type="number" defaultValue="80" className="w-full" />
          </div>
          <div>
            <Label htmlFor="test-split" className="mb-1.5 block">Test %</Label>
            <Input id="test-split" type="number" defaultValue="20" className="w-full" />
          </div>
        </div>
      </Card>

      {/* Models & Parameters */}
      <Card className="p-4">
        <h3 className="mb-3">Models & Parameters</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="rf" defaultChecked />
              <label htmlFor="rf" className="cursor-pointer">RandomForest</label>
            </div>
            <div className="pl-6 flex items-center gap-3">
              <span className="text-sm text-gray-600">n_estimators</span>
              <Input type="number" defaultValue="300" className="w-20 h-7 px-2 text-sm" />
              <span className="text-sm text-gray-600">max_depth</span>
              <Input type="text" defaultValue="None" className="w-20 h-7 px-2 text-sm" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="gb" defaultChecked />
              <label htmlFor="gb" className="cursor-pointer">GradientBoosting</label>
            </div>
            <div className="pl-6 flex items-center gap-3">
              <span className="text-sm text-gray-600">n_estimators</span>
              <Input type="number" defaultValue="300" className="w-20 h-7 px-2 text-sm" />
              <span className="text-sm text-gray-600">learning_rate</span>
              <Input type="number" defaultValue="0.05" step="0.01" className="w-20 h-7 px-2 text-sm" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="svr" defaultChecked />
              <label htmlFor="svr" className="cursor-pointer">SVR (RBF)</label>
            </div>
            <div className="pl-6 flex items-center gap-3 flex-wrap">
              <span className="text-sm text-gray-600">C</span>
              <Input type="number" defaultValue="10.0" step="0.1" className="w-20 h-7 px-2 text-sm" />
              <span className="text-sm text-gray-600">epsilon</span>
              <Input type="number" defaultValue="0.1" step="0.01" className="w-20 h-7 px-2 text-sm" />
              <span className="text-sm text-gray-600">gamma</span>
              <Input type="text" defaultValue="scale" className="w-20 h-7 px-2 text-sm" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="ridge" defaultChecked />
              <label htmlFor="ridge" className="cursor-pointer">Ridge</label>
            </div>
            <div className="pl-6 flex items-center gap-3">
              <span className="text-sm text-gray-600">alpha</span>
              <Input type="number" defaultValue="1.0" step="0.1" className="w-20 h-7 px-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t">
          <Label className="mb-2 block">Scaling</Label>
          <RadioGroup defaultValue="standard" className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="standard" id="standard" />
              <Label htmlFor="standard" className="cursor-pointer">StandardScaler</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="none" />
              <Label htmlFor="none" className="cursor-pointer">None</Label>
            </div>
          </RadioGroup>
          <p className="text-sm text-gray-500 mt-2">SVR works best with scaling.</p>
        </div>
      </Card>

      {/* Ensemble */}
      <Card className="p-4">
        <h3 className="mb-3">Ensemble</h3>
        <RadioGroup defaultValue="mean" className="space-y-2 mb-3">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="mean" id="mean" />
            <Label htmlFor="mean" className="cursor-pointer">Mean</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="median" id="median" />
            <Label htmlFor="median" className="cursor-pointer">Median</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="weighted" id="weighted" />
            <Label htmlFor="weighted" className="cursor-pointer">Weighted</Label>
          </div>
        </RadioGroup>
        <div className="flex items-center space-x-2">
          <Checkbox id="learn-weights" disabled />
          <label htmlFor="learn-weights" className="text-sm text-gray-400 cursor-not-allowed">
            Learn weights from CV
          </label>
        </div>
      </Card>
    </div>
  );
}
