// Custom hook for training configuration with TanStack Query

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchTrainingConfig, 
  saveTrainingConfig, 
  validateTrainingConfig,
  type SaveConfigResponse,
  type ValidateConfigResponse
} from '../api/trainingApi';
import type { TrainingConfig, ValidationError } from '../types/training';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const TRAINING_CONFIG_KEY = ['training', 'config'] as const;

export function useTrainingConfig() {
  const queryClient = useQueryClient();
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [lastSavedConfigId, setLastSavedConfigId] = useState<string | null>(null);

  // Query for fetching config
  const {
    data: config,
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery({
    queryKey: TRAINING_CONFIG_KEY,
    queryFn: fetchTrainingConfig,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Mutation for saving config
  const saveMutation = useMutation({
    mutationFn: saveTrainingConfig,
    onMutate: async (newConfig) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: TRAINING_CONFIG_KEY });
      
      // Snapshot previous value for rollback
      const previousConfig = queryClient.getQueryData<TrainingConfig>(TRAINING_CONFIG_KEY);
      
      // Optimistically update the cache
      queryClient.setQueryData(TRAINING_CONFIG_KEY, newConfig);
      
      return { previousConfig };
    },
    onSuccess: (response: SaveConfigResponse, savedConfig) => {
      // Update cache with the config we sent (server confirmed save)
      queryClient.setQueryData(TRAINING_CONFIG_KEY, savedConfig);
      setLastSavedConfigId(response.configId);
      setValidationErrors([]);
      toast.success('Configuration saved successfully', {
        description: `Saved at ${new Date(response.savedAt).toLocaleTimeString()}`,
      });
    },
    onError: (error, _newConfig, context) => {
      // Rollback to previous value on error
      if (context?.previousConfig) {
        queryClient.setQueryData(TRAINING_CONFIG_KEY, context.previousConfig);
      }
      toast.error(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Mutation for validation
  const validateMutation = useMutation({
    mutationFn: validateTrainingConfig,
    onSuccess: (result: ValidateConfigResponse) => {
      if (result.isValid) {
        setValidationErrors([]);
        const runtimeInfo = result.runPreview 
          ? ` (Est. runtime: ${result.runPreview.estRuntimeMinutes} min)`
          : '';
        toast.success('Validation passed' + runtimeInfo, {
          description: result.warnings.length > 0 
            ? `${result.warnings.length} warning(s) to review.`
            : 'Configuration is valid and ready to use.',
        });
      } else {
        // Convert blockers to ValidationError format
        const errors: ValidationError[] = result.blockers.map(b => ({
          field: b.fieldPath,
          message: b.message,
        }));
        setValidationErrors(errors);
        toast.error('Validation failed', {
          description: `${result.blockers.length} blocker(s) found.`,
        });
      }
    },
    onError: (error) => {
      toast.error(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    },
  });

  // Handler functions
  const handleSave = useCallback(async (newConfig: TrainingConfig) => {
    return saveMutation.mutateAsync(newConfig);
  }, [saveMutation]);

  const handleValidate = useCallback(async (configToValidate: TrainingConfig) => {
    return validateMutation.mutateAsync(configToValidate);
  }, [validateMutation]);

  const clearValidationErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  return {
    // Data
    config,
    validationErrors,
    lastSavedConfigId,
    
    // Loading states
    isLoading,
    isSaving: saveMutation.isPending,
    isValidating: validateMutation.isPending,
    
    // Error states
    fetchError,
    
    // Actions
    saveConfig: handleSave,
    validateConfig: handleValidate,
    clearValidationErrors,
    refetch,
  };
}
