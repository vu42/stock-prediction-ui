import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { X, Check, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner@2.0.3";

// Define default values for all sections
const DEFAULTS = {
  stockUniverse: {
    enabledTickers: new Set(["FPT", "VCB", "VNM", "HPG", "VIC", "VHM", "MSN", "SAB", "TCB", "GAS"]),
    useAllVN30: true,
  },
  dataWindow: {
    windowType: "n-days",
    nDays: 240,
    skipRefetch: false,
  },
  indicators: {
    smaEnabled: true,
    smaWindows: [5, 20, 60],
    emaEnabled: true,
    emaPair: { fast: 12, slow: 26 },
    rocEnabled: false,
    rocPeriod: 12,
    rocMode: "percent",
    rocPriceSource: "close",
    rocEpsilon: "1e-8",
  },
  targetSplits: {
    horizons: new Set(["3d", "7d", "15d", "30d"]),
    lookback: 60,
    trainSplit: 80,
    testSplit: 20,
  },
  models: {
    enabledModels: new Set(["rf", "gb", "svr", "ridge"]),
    scaling: "standard",
  },
  ensemble: {
    method: "mean",
    learnWeightsFromCV: true,
  },
  reproducibility: {
    randomSeed: 42,
  },
};

export function TrainingConfig() {
  const allTickers = ["FPT", "VCB", "VNM", "HPG", "VIC", "VHM", "MSN", "SAB", "TCB", "GAS"];

  // State for Stock Universe
  const [enabledTickers, setEnabledTickers] = useState<Set<string>>(
    new Set(DEFAULTS.stockUniverse.enabledTickers)
  );
  const [useAllVN30, setUseAllVN30] = useState(DEFAULTS.stockUniverse.useAllVN30);

  // State for Data Window
  const [windowType, setWindowType] = useState(DEFAULTS.dataWindow.windowType);
  const [nDays, setNDays] = useState(DEFAULTS.dataWindow.nDays);
  const [skipRefetch, setSkipRefetch] = useState(DEFAULTS.dataWindow.skipRefetch);

  // State for Indicators
  const [smaEnabled, setSmaEnabled] = useState(DEFAULTS.indicators.smaEnabled);
  const [smaWindows, setSmaWindows] = useState<number[]>(DEFAULTS.indicators.smaWindows);
  const [emaEnabled, setEmaEnabled] = useState(DEFAULTS.indicators.emaEnabled);
  const [emaPair, setEmaPair] = useState<{ fast: number; slow: number }>(
    DEFAULTS.indicators.emaPair
  );
  const [rocEnabled, setRocEnabled] = useState(DEFAULTS.indicators.rocEnabled);
  const [rocPeriod, setRocPeriod] = useState(DEFAULTS.indicators.rocPeriod);
  const [rocMode, setRocMode] = useState(DEFAULTS.indicators.rocMode);
  const [rocPriceSource, setRocPriceSource] = useState(DEFAULTS.indicators.rocPriceSource);
  const [rocEpsilon, setRocEpsilon] = useState(DEFAULTS.indicators.rocEpsilon);

  // State for Target & Splits
  const [selectedHorizons, setSelectedHorizons] = useState<Set<string>>(
    new Set(DEFAULTS.targetSplits.horizons)
  );
  const [lookback, setLookback] = useState(DEFAULTS.targetSplits.lookback);
  const [trainSplit, setTrainSplit] = useState(DEFAULTS.targetSplits.trainSplit);
  const [testSplit, setTestSplit] = useState(DEFAULTS.targetSplits.testSplit);

  // State for Models
  const [enabledModels, setEnabledModels] = useState<Set<string>>(
    new Set(DEFAULTS.models.enabledModels)
  );
  const [scaling, setScaling] = useState(DEFAULTS.models.scaling);
  const [showModelTooltip, setShowModelTooltip] = useState<string | null>(null);

  // State for Ensemble
  const [ensembleMethod, setEnsembleMethod] = useState(DEFAULTS.ensemble.method);
  const [learnWeightsFromCV, setLearnWeightsFromCV] = useState(
    DEFAULTS.ensemble.learnWeightsFromCV
  );

  // Saved state (for dirty tracking)
  const [savedState, setSavedState] = useState<any>(null);

  // Dirty flags
  const [dirtyFlags, setDirtyFlags] = useState({
    stockUniverse: false,
    dataWindow: false,
    indicators: false,
    targetSplits: false,
    models: false,
    ensemble: false,
    reproducibility: false,
  });

  // Modal states
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<string | null>(null);

  // Loading states
  const [isValidating, setIsValidating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize saved state
  useEffect(() => {
    setSavedState(getCurrentState());
  }, []);

  // Get current state
  const getCurrentState = () => ({
    stockUniverse: { enabledTickers: new Set(enabledTickers), useAllVN30 },
    dataWindow: { windowType, nDays, skipRefetch },
    indicators: {
      smaEnabled,
      smaWindows: [...smaWindows],
      emaEnabled,
      emaPair: { ...emaPair },
      rocEnabled,
      rocPeriod,
      rocMode,
      rocPriceSource,
      rocEpsilon,
    },
    targetSplits: {
      horizons: new Set(selectedHorizons),
      lookback,
      trainSplit,
      testSplit,
    },
    models: { enabledModels: new Set(enabledModels), scaling },
    ensemble: { method: ensembleMethod, learnWeightsFromCV },
    reproducibility: { randomSeed: 42 },
  });

  // Check if state changed
  useEffect(() => {
    if (!savedState) return;

    const current = getCurrentState();
    const flags = {
      stockUniverse:
        JSON.stringify([...current.stockUniverse.enabledTickers].sort()) !==
          JSON.stringify([...savedState.stockUniverse.enabledTickers].sort()) ||
        current.stockUniverse.useAllVN30 !== savedState.stockUniverse.useAllVN30,
      dataWindow:
        current.dataWindow.windowType !== savedState.dataWindow.windowType ||
        current.dataWindow.nDays !== savedState.dataWindow.nDays ||
        current.dataWindow.skipRefetch !== savedState.dataWindow.skipRefetch,
      indicators:
        current.indicators.smaEnabled !== savedState.indicators.smaEnabled ||
        JSON.stringify(current.indicators.smaWindows) !==
          JSON.stringify(savedState.indicators.smaWindows) ||
        current.indicators.emaEnabled !== savedState.indicators.emaEnabled ||
        JSON.stringify(current.indicators.emaPair) !==
          JSON.stringify(savedState.indicators.emaPair) ||
        current.indicators.rocEnabled !== savedState.indicators.rocEnabled ||
        current.indicators.rocPeriod !== savedState.indicators.rocPeriod ||
        current.indicators.rocMode !== savedState.indicators.rocMode ||
        current.indicators.rocPriceSource !== savedState.indicators.rocPriceSource ||
        current.indicators.rocEpsilon !== savedState.indicators.rocEpsilon,
      targetSplits:
        JSON.stringify([...current.targetSplits.horizons].sort()) !==
          JSON.stringify([...savedState.targetSplits.horizons].sort()) ||
        current.targetSplits.lookback !== savedState.targetSplits.lookback ||
        current.targetSplits.trainSplit !== savedState.targetSplits.trainSplit ||
        current.targetSplits.testSplit !== savedState.targetSplits.testSplit,
      models:
        JSON.stringify([...current.models.enabledModels].sort()) !==
          JSON.stringify([...savedState.models.enabledModels].sort()) ||
        current.models.scaling !== savedState.models.scaling,
      ensemble:
        current.ensemble.method !== savedState.ensemble.method ||
        current.ensemble.learnWeightsFromCV !== savedState.ensemble.learnWeightsFromCV,
      reproducibility: false,
    };

    setDirtyFlags(flags);
  }, [
    enabledTickers,
    useAllVN30,
    windowType,
    nDays,
    skipRefetch,
    smaEnabled,
    smaWindows,
    emaEnabled,
    emaPair,
    rocEnabled,
    rocPeriod,
    rocMode,
    rocPriceSource,
    rocEpsilon,
    selectedHorizons,
    lookback,
    trainSplit,
    testSplit,
    enabledModels,
    scaling,
    ensembleMethod,
    learnWeightsFromCV,
    savedState,
  ]);

  const isGlobalDirty = Object.values(dirtyFlags).some((flag) => flag);

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save operation
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSavedState(getCurrentState());
    setIsSaving(false);
    toast.success("Changes saved.");
  };

  // Handle Discard
  const handleDiscardConfirm = () => {
    if (!savedState) return;

    // Restore all sections
    setEnabledTickers(new Set(savedState.stockUniverse.enabledTickers));
    setUseAllVN30(savedState.stockUniverse.useAllVN30);
    setWindowType(savedState.dataWindow.windowType);
    setNDays(savedState.dataWindow.nDays);
    setSkipRefetch(savedState.dataWindow.skipRefetch);
    setSmaEnabled(savedState.indicators.smaEnabled);
    setSmaWindows([...savedState.indicators.smaWindows]);
    setEmaEnabled(savedState.indicators.emaEnabled);
    setEmaPair({ ...savedState.indicators.emaPair });
    setRocEnabled(savedState.indicators.rocEnabled);
    setRocPeriod(savedState.indicators.rocPeriod);
    setRocMode(savedState.indicators.rocMode);
    setRocPriceSource(savedState.indicators.rocPriceSource);
    setRocEpsilon(savedState.indicators.rocEpsilon);
    setSelectedHorizons(new Set(savedState.targetSplits.horizons));
    setLookback(savedState.targetSplits.lookback);
    setTrainSplit(savedState.targetSplits.trainSplit);
    setTestSplit(savedState.targetSplits.testSplit);
    setEnabledModels(new Set(savedState.models.enabledModels));
    setScaling(savedState.models.scaling);
    setEnsembleMethod(savedState.ensemble.method);
    setLearnWeightsFromCV(savedState.ensemble.learnWeightsFromCV);

    setShowDiscardModal(false);
    toast.success("Changes discarded.");
  };

  // Handle Validate
  const handleValidate = async () => {
    setIsValidating(true);
    // Simulate validation
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsValidating(false);
    toast.success("Validation passed", {
      icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    });
  };

  // Handle Reset Section
  const handleResetSection = (section: string) => {
    switch (section) {
      case "stockUniverse":
        setEnabledTickers(new Set(DEFAULTS.stockUniverse.enabledTickers));
        setUseAllVN30(DEFAULTS.stockUniverse.useAllVN30);
        break;
      case "dataWindow":
        setWindowType(DEFAULTS.dataWindow.windowType);
        setNDays(DEFAULTS.dataWindow.nDays);
        setSkipRefetch(DEFAULTS.dataWindow.skipRefetch);
        break;
      case "indicators":
        setSmaEnabled(DEFAULTS.indicators.smaEnabled);
        setSmaWindows(DEFAULTS.indicators.smaWindows);
        setEmaEnabled(DEFAULTS.indicators.emaEnabled);
        setEmaPair(DEFAULTS.indicators.emaPair);
        setRocEnabled(DEFAULTS.indicators.rocEnabled);
        setRocPeriod(DEFAULTS.indicators.rocPeriod);
        setRocMode(DEFAULTS.indicators.rocMode);
        setRocPriceSource(DEFAULTS.indicators.rocPriceSource);
        setRocEpsilon(DEFAULTS.indicators.rocEpsilon);
        break;
      case "targetSplits":
        setSelectedHorizons(new Set(DEFAULTS.targetSplits.horizons));
        setLookback(DEFAULTS.targetSplits.lookback);
        setTrainSplit(DEFAULTS.targetSplits.trainSplit);
        setTestSplit(DEFAULTS.targetSplits.testSplit);
        break;
      case "models":
        setEnabledModels(new Set(DEFAULTS.models.enabledModels));
        setScaling(DEFAULTS.models.scaling);
        break;
      case "ensemble":
        setEnsembleMethod(DEFAULTS.ensemble.method);
        setLearnWeightsFromCV(DEFAULTS.ensemble.learnWeightsFromCV);
        break;
      case "reproducibility":
        // Nothing to reset for now
        break;
    }
    setShowResetModal(null);
    toast.success("Section reset to defaults.");
  };

  // Toggle functions
  const toggleTicker = (ticker: string) => {
    const newEnabled = new Set(enabledTickers);
    if (newEnabled.has(ticker)) {
      newEnabled.delete(ticker);
      setUseAllVN30(false);
    } else {
      newEnabled.add(ticker);
      if (newEnabled.size === allTickers.length) {
        setUseAllVN30(true);
      }
    }
    setEnabledTickers(newEnabled);
  };

  const handleUseAllVN30Change = (checked: boolean) => {
    setUseAllVN30(checked);
    if (checked) {
      setEnabledTickers(new Set(allTickers));
    } else {
      setEnabledTickers(new Set());
    }
  };

  const toggleHorizon = (horizon: string) => {
    const newSelected = new Set(selectedHorizons);
    if (newSelected.has(horizon)) {
      if (newSelected.size > 1) {
        newSelected.delete(horizon);
      }
    } else {
      newSelected.add(horizon);
    }
    setSelectedHorizons(newSelected);
  };

  const toggleModel = (model: string) => {
    const newEnabled = new Set(enabledModels);
    if (newEnabled.has(model)) {
      if (newEnabled.size > 1) {
        newEnabled.delete(model);
        setEnabledModels(newEnabled);
      } else {
        setShowModelTooltip(model);
        setTimeout(() => setShowModelTooltip(null), 1500);
      }
    } else {
      newEnabled.add(model);
      setEnabledModels(newEnabled);
    }
  };

  // SMA functions
  const updateSmaWindow = (index: number, value: number) => {
    const newWindows = [...smaWindows];
    newWindows[index] = value;
    setSmaWindows(newWindows);
  };

  // EMA functions
  const updateEmaPair = (field: "fast" | "slow", value: number) => {
    setEmaPair({ ...emaPair, [field]: value });
  };

  // Section header with optional Reset button
  const SectionHeader = ({ title, section }: { title: string; section: string }) => (
    <div className="flex items-center justify-between mb-3">
      <h3>{title}</h3>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResetModal(section)}
              className="h-7 gap-1.5 text-gray-600 hover:text-gray-900"
              disabled={!dirtyFlags[section as keyof typeof dirtyFlags]}
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{dirtyFlags[section as keyof typeof dirtyFlags] ? "Reset to defaults" : "No changes to reset"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  return (
    <>
      <div className="space-y-4 pb-24">
        {/* Stock Universe */}
        <Card className="p-4">
          <SectionHeader title="Stock Universe" section="stockUniverse" />
          <div className="flex flex-wrap gap-2 mb-3">
            <TooltipProvider delayDuration={300}>
              {allTickers.map((ticker) => {
                const isEnabled = enabledTickers.has(ticker);
                return (
                  <Tooltip key={ticker}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => toggleTicker(ticker)}
                        className="hover:scale-110 transition-transform"
                        aria-label={isEnabled ? `Disable ${ticker}` : `Enable ${ticker}`}
                      >
                        <Badge
                          variant={isEnabled ? "secondary" : "outline"}
                          className="px-3 py-1.5 gap-1.5 cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          {ticker}
                          {isEnabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        </Badge>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isEnabled ? `Disable ${ticker}` : `Enable ${ticker}`}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="vn30"
              checked={useAllVN30}
              onCheckedChange={handleUseAllVN30Change}
            />
            <label htmlFor="vn30" className="text-sm cursor-pointer">
              Use all VN30
            </label>
          </div>
        </Card>

        {/* Data Window */}
        <Card className="p-4">
          <SectionHeader title="Data Window" section="dataWindow" />
          <RadioGroup
            value={windowType}
            onValueChange={setWindowType}
            className="space-y-3 mb-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="n-days" id="n-days" />
              <Label htmlFor="n-days" className="cursor-pointer">
                Last N days
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="date-range" id="date-range" />
              <Label htmlFor="date-range" className="cursor-pointer">
                Date range
              </Label>
            </div>
          </RadioGroup>
          <div className="mb-3">
            <Label htmlFor="n-days-input" className="mb-1.5 block">
              N days
            </Label>
            <Input
              id="n-days-input"
              type="number"
              value={nDays}
              onChange={(e) => setNDays(Number(e.target.value))}
              className="w-32"
            />
          </div>
          <div className="flex items-center space-x-2 mb-2">
            <Checkbox
              id="skip-refetch"
              checked={skipRefetch}
              onCheckedChange={(checked) => setSkipRefetch(!!checked)}
            />
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
          <SectionHeader title="Indicators" section="indicators" />
          <div className="space-y-6">
            {/* Price Section */}
            <div>
              <p className="mb-3 text-gray-700">Price</p>
              <div className="space-y-4 pl-2">
                {/* SMA */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sma"
                      checked={smaEnabled}
                      onCheckedChange={(checked) => setSmaEnabled(!!checked)}
                    />
                    <label htmlFor="sma" className="text-sm cursor-pointer">
                      SMA
                    </label>
                  </div>
                  {smaEnabled && (
                    <div className="pl-6 flex items-center gap-2">
                      <span className="text-sm text-gray-600">windows</span>
                      {smaWindows.map((window, index) => (
                        <Input
                          key={index}
                          type="number"
                          value={window}
                          onChange={(e) => updateSmaWindow(index, Number(e.target.value))}
                          className="w-16 h-7 px-2 text-sm"
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* EMA */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="ema"
                      checked={emaEnabled}
                      onCheckedChange={(checked) => setEmaEnabled(!!checked)}
                    />
                    <label htmlFor="ema" className="text-sm cursor-pointer">
                      EMA
                    </label>
                  </div>
                  {emaEnabled && (
                    <div className="pl-6 flex items-center gap-2">
                      <span className="text-sm text-gray-600">fast</span>
                      <Input
                        type="number"
                        value={emaPair.fast}
                        onChange={(e) => updateEmaPair("fast", Number(e.target.value))}
                        className="w-16 h-7 px-2 text-sm"
                      />
                      <span className="text-sm text-gray-600">slow</span>
                      <Input
                        type="number"
                        value={emaPair.slow}
                        onChange={(e) => updateEmaPair("slow", Number(e.target.value))}
                        className="w-16 h-7 px-2 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* ROC */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="roc"
                      checked={rocEnabled}
                      onCheckedChange={(checked) => setRocEnabled(!!checked)}
                    />
                    <label htmlFor="roc" className="text-sm cursor-pointer">
                      ROC
                    </label>
                  </div>
                  {rocEnabled && (
                    <div className="pl-6 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">period</span>
                        <Input
                          type="number"
                          value={rocPeriod}
                          onChange={(e) => setRocPeriod(Number(e.target.value))}
                          className="w-16 h-7 px-2 text-sm"
                        />
                        <span className="text-sm text-gray-600">mode</span>
                        <Select value={rocMode} onValueChange={setRocMode}>
                          <SelectTrigger className="w-24 h-7 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percent">percent</SelectItem>
                            <SelectItem value="log">log</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">price</span>
                        <Select value={rocPriceSource} onValueChange={setRocPriceSource}>
                          <SelectTrigger className="w-20 h-7 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="close">close</SelectItem>
                            <SelectItem value="open">open</SelectItem>
                            <SelectItem value="high">high</SelectItem>
                            <SelectItem value="low">low</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-600">ε</span>
                        <Input
                          type="text"
                          value={rocEpsilon}
                          onChange={(e) => setRocEpsilon(e.target.value)}
                          className="w-20 h-7 px-2 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Momentum Section (simplified) */}
            <div>
              <p className="mb-3 text-gray-700">Momentum</p>
              <div className="space-y-2 pl-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="rsi" defaultChecked />
                  <label htmlFor="rsi" className="text-sm cursor-pointer">
                    RSI
                  </label>
                  <span className="text-sm text-gray-500">window</span>
                  <Input type="number" defaultValue="14" className="w-16 h-7 px-2 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="macd" defaultChecked />
                  <label htmlFor="macd" className="text-sm cursor-pointer">
                    MACD
                  </label>
                  <span className="text-sm text-gray-500">fast</span>
                  <Input type="number" defaultValue="12" className="w-16 h-7 px-2 text-sm" />
                  <span className="text-sm text-gray-500">slow</span>
                  <Input type="number" defaultValue="26" className="w-16 h-7 px-2 text-sm" />
                  <span className="text-sm text-gray-500">signal</span>
                  <Input type="number" defaultValue="9" className="w-16 h-7 px-2 text-sm" />
                </div>
              </div>
            </div>

            {/* Volatility Section (simplified) */}
            <div>
              <p className="mb-3 text-gray-700">Volatility</p>
              <div className="space-y-2 pl-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="bb" defaultChecked />
                  <label htmlFor="bb" className="text-sm cursor-pointer">
                    Bollinger Bands
                  </label>
                  <span className="text-sm text-gray-500">window</span>
                  <Input type="number" defaultValue="20" className="w-16 h-7 px-2 text-sm" />
                  <span className="text-sm text-gray-500">std</span>
                  <Input type="number" defaultValue="2" className="w-16 h-7 px-2 text-sm" />
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="atr" />
                  <label htmlFor="atr" className="text-sm cursor-pointer">
                    ATR
                  </label>
                  <span className="text-sm text-gray-500">window</span>
                  <Input type="number" defaultValue="14" className="w-16 h-7 px-2 text-sm" />
                </div>
              </div>
            </div>

            {/* Volume Section (simplified) */}
            <div>
              <p className="mb-3 text-gray-700">Volume</p>
              <div className="pl-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="volume-ma" defaultChecked />
                  <label htmlFor="volume-ma" className="text-sm cursor-pointer">
                    Volume MA
                  </label>
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
          <SectionHeader title="Target & Splits" section="targetSplits" />
          <div className="mb-4">
            <Label className="mb-2 block">Horizons</Label>
            <div className="flex gap-2">
              {["3d", "7d", "15d", "30d"].map((horizon) => {
                const isSelected = selectedHorizons.has(horizon);
                return (
                  <Badge
                    key={horizon}
                    variant={isSelected ? "default" : "outline"}
                    className="px-3 py-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => toggleHorizon(horizon)}
                  >
                    {horizon}
                  </Badge>
                );
              })}
            </div>
          </div>
          <div className="mb-4">
            <Label htmlFor="lookback" className="mb-1.5 block">
              Lookback window
            </Label>
            <Input
              id="lookback"
              type="number"
              value={lookback}
              onChange={(e) => setLookback(Number(e.target.value))}
              className="w-32"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="train-split" className="mb-1.5 block">
                Train %
              </Label>
              <Input
                id="train-split"
                type="number"
                value={trainSplit}
                onChange={(e) => setTrainSplit(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="test-split" className="mb-1.5 block">
                Test %
              </Label>
              <Input
                id="test-split"
                type="number"
                value={testSplit}
                onChange={(e) => setTestSplit(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </Card>

        {/* Models & Parameters */}
        <Card className="p-4">
          <SectionHeader title="Models & Parameters" section="models" />
          <TooltipProvider delayDuration={0}>
            <div className="space-y-3">
              {/* RandomForest */}
              <div className="space-y-2">
                <Tooltip open={showModelTooltip === "rf"}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rf"
                        checked={enabledModels.has("rf")}
                        onCheckedChange={() => toggleModel("rf")}
                      />
                      <label htmlFor="rf" className="cursor-pointer">
                        RandomForest
                      </label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>At least one model is required.</p>
                  </TooltipContent>
                </Tooltip>
                <div className="pl-6 flex items-center gap-3">
                  <span className="text-sm text-gray-600">n_estimators</span>
                  <Input
                    type="number"
                    defaultValue="300"
                    className="w-20 h-7 px-2 text-sm"
                  />
                  <span className="text-sm text-gray-600">max_depth</span>
                  <Input type="text" defaultValue="None" className="w-20 h-7 px-2 text-sm" />
                </div>
              </div>

              {/* GradientBoosting */}
              <div className="space-y-2">
                <Tooltip open={showModelTooltip === "gb"}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="gb"
                        checked={enabledModels.has("gb")}
                        onCheckedChange={() => toggleModel("gb")}
                      />
                      <label htmlFor="gb" className="cursor-pointer">
                        GradientBoosting
                      </label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>At least one model is required.</p>
                  </TooltipContent>
                </Tooltip>
                <div className="pl-6 flex items-center gap-3">
                  <span className="text-sm text-gray-600">n_estimators</span>
                  <Input
                    type="number"
                    defaultValue="300"
                    className="w-20 h-7 px-2 text-sm"
                  />
                  <span className="text-sm text-gray-600">learning_rate</span>
                  <Input
                    type="number"
                    defaultValue="0.05"
                    step="0.01"
                    className="w-20 h-7 px-2 text-sm"
                  />
                </div>
              </div>

              {/* SVR */}
              <div className="space-y-2">
                <Tooltip open={showModelTooltip === "svr"}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="svr"
                        checked={enabledModels.has("svr")}
                        onCheckedChange={() => toggleModel("svr")}
                      />
                      <label htmlFor="svr" className="cursor-pointer">
                        SVR (RBF)
                      </label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>At least one model is required.</p>
                  </TooltipContent>
                </Tooltip>
                <div className="pl-6 flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-gray-600">C</span>
                  <Input
                    type="number"
                    defaultValue="10.0"
                    step="0.1"
                    className="w-20 h-7 px-2 text-sm"
                  />
                  <span className="text-sm text-gray-600">epsilon</span>
                  <Input
                    type="number"
                    defaultValue="0.1"
                    step="0.01"
                    className="w-20 h-7 px-2 text-sm"
                  />
                  <span className="text-sm text-gray-600">gamma</span>
                  <Input type="text" defaultValue="scale" className="w-20 h-7 px-2 text-sm" />
                </div>
              </div>

              {/* Ridge */}
              <div className="space-y-2">
                <Tooltip open={showModelTooltip === "ridge"}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="ridge"
                        checked={enabledModels.has("ridge")}
                        onCheckedChange={() => toggleModel("ridge")}
                      />
                      <label htmlFor="ridge" className="cursor-pointer">
                        Ridge
                      </label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>At least one model is required.</p>
                  </TooltipContent>
                </Tooltip>
                <div className="pl-6 flex items-center gap-3">
                  <span className="text-sm text-gray-600">alpha</span>
                  <Input
                    type="number"
                    defaultValue="1.0"
                    step="0.1"
                    className="w-20 h-7 px-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </TooltipProvider>

          <div className="mt-4 pt-3 border-t">
            <Label className="mb-2 block">Scaling</Label>
            <RadioGroup value={scaling} onValueChange={setScaling} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard" className="cursor-pointer">
                  StandardScaler
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="none" />
                <Label htmlFor="none" className="cursor-pointer">
                  None
                </Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-gray-500 mt-2">SVR works best with scaling.</p>
          </div>
        </Card>

        {/* Ensemble */}
        <Card className="p-4">
          <SectionHeader title="Ensemble" section="ensemble" />
          <RadioGroup
            value={ensembleMethod}
            onValueChange={setEnsembleMethod}
            className="space-y-2 mb-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mean" id="mean" />
              <Label htmlFor="mean" className="cursor-pointer">
                Mean
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="median" id="median" />
              <Label htmlFor="median" className="cursor-pointer">
                Median
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="weighted" id="weighted" />
              <Label htmlFor="weighted" className="cursor-pointer">
                Weighted
              </Label>
            </div>
          </RadioGroup>

          <div className="border-t pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="learn-weights-switch" className="text-sm cursor-pointer">
                Learn weights from CV
              </label>
              <Switch
                id="learn-weights-switch"
                checked={learnWeightsFromCV}
                onCheckedChange={setLearnWeightsFromCV}
              />
            </div>

            {learnWeightsFromCV && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  Optimizes MAE via time-series CV; weights may differ per horizon.
                </p>
              </div>
            )}

            {!learnWeightsFromCV && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-600">Manual Weights (per model)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-20">RF</span>
                    <Input
                      type="number"
                      defaultValue="0.25"
                      step="0.05"
                      className="w-20 h-7 px-2 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-20">GB</span>
                    <Input
                      type="number"
                      defaultValue="0.25"
                      step="0.05"
                      className="w-20 h-7 px-2 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-20">SVR</span>
                    <Input
                      type="number"
                      defaultValue="0.25"
                      step="0.05"
                      className="w-20 h-7 px-2 text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 w-20">Ridge</span>
                    <Input
                      type="number"
                      defaultValue="0.25"
                      step="0.05"
                      className="w-20 h-7 px-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Reproducibility */}
        <Card className="p-4">
          <SectionHeader title="Reproducibility" section="reproducibility" />
          <div>
            <Label htmlFor="random-seed" className="mb-1.5 block">
              Random seed
            </Label>
            <Input
              id="random-seed"
              type="number"
              defaultValue="42"
              className="w-32"
            />
          </div>
        </Card>
      </div>

      {/* Global Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-4xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleValidate}
              disabled={isValidating || isSaving}
              className="cursor-pointer"
            >
              {isValidating ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2" />
                  Validating...
                </>
              ) : (
                "Validate Config"
              )}
            </Button>

            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSave}
                    disabled={!isGlobalDirty || isSaving}
                    className="cursor-pointer"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </TooltipTrigger>
                {!isGlobalDirty && (
                  <TooltipContent>
                    <p>Nothing to save</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            <Button
              variant="secondary"
              onClick={() => setShowDiscardModal(true)}
              disabled={!isGlobalDirty || isSaving}
              className="cursor-pointer"
            >
              Discard Changes
            </Button>
          </div>

          {isGlobalDirty && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
              <AlertCircle className="w-3 h-3 mr-1.5" />
              Unsaved changes
            </Badge>
          )}
        </div>
      </div>

      {/* Discard Modal */}
      <AlertDialog open={showDiscardModal} onOpenChange={setShowDiscardModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard all unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              All modifications will be lost and the configuration will be restored to the last saved state.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Section Modal */}
      <AlertDialog open={showResetModal !== null} onOpenChange={() => setShowResetModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset this section to default settings?</AlertDialogTitle>
            <AlertDialogDescription>
              This will restore all fields in this section to their default values. This action will mark the page as having unsaved changes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => showResetModal && handleResetSection(showResetModal)}>
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
