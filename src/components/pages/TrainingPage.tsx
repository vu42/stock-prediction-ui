import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TrainingConfig } from '../TrainingConfig';
import { useTrainingConfig } from '../../hooks/useTrainingConfig';
import { Skeleton } from '../ui/skeleton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

// Create a client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

// Loading skeleton for the training config page
function TrainingConfigSkeleton() {
  return (
    <div className="space-y-4 pb-24">
      {/* Stock Universe skeleton */}
      <Card className="p-4">
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="flex flex-wrap gap-2 mb-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-5 w-24" />
      </Card>

      {/* Data Window skeleton */}
      <Card className="p-4">
        <Skeleton className="h-6 w-28 mb-3" />
        <div className="space-y-3 mb-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-9 w-32 mb-3" />
        <Skeleton className="h-5 w-40" />
      </Card>

      {/* Indicators skeleton */}
      <Card className="p-4">
        <Skeleton className="h-6 w-24 mb-3" />
        <div className="space-y-4">
          <Skeleton className="h-5 w-16" />
          <div className="space-y-2 pl-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-48" />
          </div>
        </div>
      </Card>

      {/* Target & Splits skeleton */}
      <Card className="p-4">
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="flex gap-2 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-12 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </Card>

      {/* Models skeleton */}
      <Card className="p-4">
        <Skeleton className="h-6 w-40 mb-3" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-7 w-48 ml-6" />
            </div>
          ))}
        </div>
      </Card>

      {/* Ensemble skeleton */}
      <Card className="p-4">
        <Skeleton className="h-6 w-24 mb-3" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
        </div>
      </Card>

      {/* Reproducibility skeleton */}
      <Card className="p-4">
        <Skeleton className="h-6 w-32 mb-3" />
        <Skeleton className="h-9 w-32" />
      </Card>
    </div>
  );
}

// Error state component
function TrainingConfigError({ 
  error, 
  onRetry 
}: { 
  error: Error; 
  onRetry: () => void;
}) {
  return (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Failed to load configuration
          </h3>
          <p className="text-sm text-gray-600 max-w-md">
            {error.message || 'An error occurred while loading the training configuration. Please try again.'}
          </p>
        </div>
        <Button onClick={onRetry} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    </Card>
  );
}

// Inner component that uses the hook (must be inside QueryClientProvider)
function TrainingPageContent() {
  const {
    config,
    isLoading,
    fetchError,
    isSaving,
    isValidating,
    validationErrors,
    saveConfig,
    validateConfig,
    clearValidationErrors,
    refetch,
  } = useTrainingConfig();

  if (isLoading) {
    return <TrainingConfigSkeleton />;
  }

  if (fetchError) {
    return (
      <TrainingConfigError 
        error={fetchError instanceof Error ? fetchError : new Error('Unknown error')} 
        onRetry={() => refetch()} 
      />
    );
  }

  return (
    <TrainingConfig
      initialConfig={config}
      onSave={saveConfig}
      onValidate={validateConfig}
      isSaving={isSaving}
      isValidating={isValidating}
      validationErrors={validationErrors}
      onClearValidationErrors={clearValidationErrors}
    />
  );
}

export function TrainingPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="max-w-4xl mx-auto px-8 py-6">
        <TrainingPageContent />
      </div>
    </QueryClientProvider>
  );
}
