import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Play, Pause, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  listDags,
  triggerDAGRun,
  pauseDAG,
  syncDagsFromAirflow,
  type DAGResponse,
  PipelinesApiError,
} from '../../api/pipelinesApi';

interface DagCatalogProps {
  selectedDag: string;
  onSelectDag: (dagId: string) => void;
  refreshTrigger?: number;
  onActionComplete?: () => void;
}

export function DagCatalog({ selectedDag, onSelectDag, refreshTrigger, onActionComplete }: DagCatalogProps) {
  const [dags, setDags] = useState<DAGResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'run' | 'pause' | 'unpause' | null;
    dagId: string;
    dagName: string;
  }>({
    open: false,
    action: null,
    dagId: '',
    dagName: '',
  });

  const fetchDags = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
        setError(null);
      }
      const data = await listDags('airflow');
      setDags(data);
      // Auto-select first DAG if none selected
      if (data.length > 0 && !selectedDag) {
        onSelectDag(data[0].dagId);
      }
    } catch (err) {
      if (err instanceof PipelinesApiError) {
        setError(err.message);
      } else {
        setError('Failed to load DAGs');
      }
      console.error('Failed to fetch DAGs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDag, onSelectDag]);

  useEffect(() => {
    fetchDags();
  }, [fetchDags]);

  // Auto-refresh when there are running/queued jobs
  useEffect(() => {
    const hasRunningJobs = dags.some(dag => 
      dag.lastRunState === 'running' || dag.lastRunState === 'queued'
    );
    
    if (hasRunningJobs) {
      const interval = setInterval(() => {
        fetchDags(false);
      }, 5000); // Refresh every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [dags, fetchDags]);

  // Refresh when parent triggers (e.g., when DagDetails performs an action)
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchDags(false);
    }
  }, [refreshTrigger, fetchDags]);

  const handleSyncFromAirflow = async () => {
    try {
      setIsSyncing(true);
      await syncDagsFromAirflow();
      toast.success('DAGs synced from Airflow');
      fetchDags();
    } catch (err) {
      if (err instanceof PipelinesApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to sync DAGs');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRunNow = (e: React.MouseEvent, dagId: string, dagName: string) => {
    e.stopPropagation();
    setConfirmDialog({
      open: true,
      action: 'run',
      dagId,
      dagName,
    });
  };

  const handlePause = (e: React.MouseEvent, dagId: string, dagName: string, isPaused: boolean) => {
    e.stopPropagation();
    setConfirmDialog({
      open: true,
      action: isPaused ? 'unpause' : 'pause',
      dagId,
      dagName,
    });
  };

  const executeAction = async () => {
    const { action, dagId } = confirmDialog;
    setConfirmDialog({ open: false, action: null, dagId: '', dagName: '' });
    
    try {
      setActionLoading(dagId);
      
      switch (action) {
        case 'run':
          await triggerDAGRun(dagId);
          toast.success('Run triggered successfully');
          break;
        case 'pause':
          await pauseDAG(dagId, true);
          toast.success('DAG paused successfully');
          break;
        case 'unpause':
          await pauseDAG(dagId, false);
          toast.success('DAG unpaused successfully');
          break;
      }
      
      // Refresh DAG list
      fetchDags();
      // Notify parent to refresh other components
      onActionComplete?.();
    } catch (err) {
      if (err instanceof PipelinesApiError) {
        toast.error(err.message);
      } else {
        toast.error('Action failed');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const formatLastRun = (dag: DAGResponse) => {
    if (!dag.lastRunAt) return 'Never';
    const date = new Date(dag.lastRunAt);
    const state = dag.lastRunState || 'unknown';
    return `${date.toLocaleString()} — ${state.charAt(0).toUpperCase() + state.slice(1)}`;
  };

  const formatNextRun = (dag: DAGResponse) => {
    if (!dag.nextRunAt) return 'N/A';
    const date = new Date(dag.nextRunAt);
    return date.toLocaleString();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-9 w-32" />
        </div>
        {[1, 2].map((i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full mb-3" />
            <div className="space-y-1.5 mb-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-44" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <Card className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchDags} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sync Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSyncFromAirflow}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Sync from Airflow
        </Button>
      </div>

      {/* DAG List */}
      {dags.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-gray-600 mb-4">No DAGs found. Click "Sync from Airflow" to fetch DAGs.</p>
        </Card>
      ) : (
        dags.map((dag) => {
          const isPaused = dag.status === 'paused';
          const isActionLoading = actionLoading === dag.dagId;
          const isRunning = dag.lastRunState === 'running' || dag.lastRunState === 'queued';
          
          return (
            <Card
              key={dag.dagId}
              className={`p-4 cursor-pointer transition-all ${
                selectedDag === dag.dagId ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => onSelectDag(dag.dagId)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-gray-900">{dag.name}</h3>
                <Badge
                  variant={isPaused ? 'secondary' : 'default'}
                  className={
                    isPaused
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-green-100 text-green-700 border-green-200'
                  }
                >
                  {isPaused ? 'Paused' : 'Active'}
                </Badge>
              </div>

              <p className="text-sm text-gray-600 mb-3">{dag.description || 'No description'}</p>

              <div className="space-y-1.5 mb-3 text-sm">
                <div className="flex gap-2">
                  <span className="text-gray-600">Schedule:</span>
                  <span className="text-gray-900 font-mono">{dag.scheduleCron}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-600">Next run:</span>
                  <span className="text-gray-900">{formatNextRun(dag)}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-600">Last run:</span>
                  <span className="text-gray-900">{formatLastRun(dag)}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className={`flex-1 ${isActionLoading || isRunning ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={(e) => handleRunNow(e, dag.dagId, dag.name)}
                  disabled={isActionLoading || isRunning}
                >
                  {isActionLoading ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : isRunning ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3 mr-1" />
                  )}
                  {isRunning ? 'Running...' : 'Run now'}
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className={`flex-1 ${isActionLoading || !isRunning ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={(e) => handlePause(e, dag.dagId, dag.name, isPaused)}
                  disabled={isActionLoading || !isRunning}
                >
                  {isActionLoading ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Pause className="w-3 h-3 mr-1" />
                  )}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
              </div>
            </Card>
          );
        })
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog({ ...confirmDialog, open })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'run' && `Run now — ${confirmDialog.dagName}?`}
              {confirmDialog.action === 'pause' && `Pause — ${confirmDialog.dagName}?`}
              {confirmDialog.action === 'unpause' && `Resume — ${confirmDialog.dagName}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeAction}>
              Yes, proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
