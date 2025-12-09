import { useState, useEffect, useCallback } from "react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import { Skeleton } from "../../ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import {
  Eye,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDAG,
  listDAGRuns,
  triggerDAGRun,
  type DAGDetailResponse,
  type DAGRunResponse,
  PipelinesApiError,
} from "../../../api/pipelinesApi";

interface OverviewTabProps {
  dagId: string;
  onViewLogs?: () => void;
  refreshTrigger?: number; // Increment to trigger refresh
}

export function OverviewTab({ dagId, onViewLogs, refreshTrigger }: OverviewTabProps) {
  const [dag, setDag] = useState<DAGDetailResponse | null>(null);
  const [lastRun, setLastRun] = useState<DAGRunResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'rerun' | null;
    title: string;
    description: string;
  }>({
    open: false,
    action: null,
    title: '',
    description: '',
  });

  const fetchData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      else setIsRefreshing(true);
      
      // Fetch DAG details
      const dagData = await getDAG(dagId);
      setDag(dagData);
      
      // Fetch last run
      const runsData = await listDAGRuns(dagId, { 
        source: 'airflow',
        pageSize: 1 
      });
      setLastRun(runsData.data.length > 0 ? runsData.data[0] : null);
    } catch (err) {
      console.error('Failed to fetch overview data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dagId]);

  // Initial fetch and refresh trigger
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  // Auto-refresh when run is in progress
  useEffect(() => {
    const isRunInProgress = lastRun && ['running', 'queued'].includes(lastRun.state);
    
    if (isRunInProgress) {
      const interval = setInterval(() => {
        fetchData(false);
      }, 5000); // Refresh every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [lastRun, fetchData]);

  const handleRerunConfirm = () => {
    setConfirmDialog({
      open: true,
      action: 'rerun',
      title: `Rerun ${dagId}?`,
      description: 'Do you want to proceed with the same configuration?',
    });
  };

  const executeAction = async () => {
    if (confirmDialog.action === 'rerun') {
      try {
        const conf = lastRun?.conf || {};
        await triggerDAGRun(dagId, { conf });
        toast.success('Rerun scheduled with same configuration.');
        fetchData(false);
      } catch (err) {
        if (err instanceof PipelinesApiError) {
          toast.error(err.message);
        } else {
          toast.error('Failed to trigger rerun');
        }
      }
    }
    setConfirmDialog({ open: false, action: null, title: '', description: '' });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStateBadge = (state: string) => {
    switch (state) {
      case 'success':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Success
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'running':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      case 'queued':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Queued
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            {state}
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
        </Card>
        <Card className="p-4">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </Card>
      </div>
    );
  }

  const isRunInProgress = lastRun && ['running', 'queued'].includes(lastRun.state);

  return (
    <div className="space-y-4">
      {/* Auto-refresh indicator */}
      {isRunInProgress && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Auto-refreshing every 5 seconds...
        </div>
      )}

      {/* Status & Schedule */}
      <Card className="p-4">
        <h3 className="mb-3">Status & Schedule</h3>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-600">State:</span>
            <Badge className={dag?.status === 'paused' 
              ? "bg-gray-100 text-gray-700 border-gray-200"
              : "bg-green-100 text-green-700 border-green-200"
            }>
              {dag?.status === 'paused' ? 'Paused' : 'Active'}
            </Badge>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-600">Schedule:</span>
            <span className="text-gray-900 font-mono">
              {dag?.scheduleCron} {dag?.scheduleLabel && `(${dag.scheduleLabel})`}
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-600">Catchup:</span>
            <span className="text-gray-900">{dag?.catchup ? 'On' : 'Off'}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-600">Max active runs:</span>
            <span className="text-gray-900">{dag?.maxActiveRuns || 1}</span>
          </div>
        </div>
      </Card>

      {/* Current/Last Run */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3>Current/Last Run</h3>
          {isRefreshing && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>

        {!lastRun ? (
          <p className="text-sm text-gray-500">No runs yet</p>
        ) : isRunInProgress ? (
          <div className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">run_id:</span>
                <span className="text-gray-900 font-mono text-xs">
                  {lastRun.runId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">State:</span>
                {getStateBadge(lastRun.state)}
              </div>
              {lastRun.state === 'running' && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Started:</span>
                  <span className="text-gray-900">
                    {lastRun.start ? new Date(lastRun.start).toLocaleString() : 'N/A'}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing...</span>
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              </div>
              <Progress value={lastRun.state === 'queued' ? 10 : 50} className="h-2" />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full cursor-pointer"
              onClick={onViewLogs}
            >
              <Eye className="w-3 h-3 mr-1" />
              View logs
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">run_id:</span>
                <span className="text-gray-900 font-mono text-xs">
                  {lastRun.runId}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Duration:</span>
                <span className="text-gray-900">{formatDuration(lastRun.durationSeconds)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">State:</span>
                {getStateBadge(lastRun.state)}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 cursor-pointer"
                onClick={onViewLogs}
              >
                <Eye className="w-3 h-3 mr-1" />
                View logs
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 cursor-pointer"
                onClick={handleRerunConfirm}
              >
                <Play className="w-3 h-3 mr-1" />
                Rerun with same conf
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog({ ...confirmDialog, open })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
              {confirmDialog.action === 'rerun' && lastRun?.conf && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                  {JSON.stringify(lastRun.conf, null, 2)}
                </div>
              )}
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
