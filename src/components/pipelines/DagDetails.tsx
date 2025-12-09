import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
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
import { OverviewTab } from './tabs/OverviewTab';
import { RunHistoryTab } from './tabs/RunHistoryTab';
import { RunDetailsTab, RunDetailsTabRef } from './tabs/RunDetailsTab';
import { EditDagTab } from './tabs/EditDagTab';
import { Play, Pause, StopCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  getDAG,
  triggerDAGRun,
  pauseDAG,
  stopDAGRun,
  listDAGRuns,
  type DAGDetailResponse,
  type DAGRunResponse,
  PipelinesApiError,
} from '../../api/pipelinesApi';

interface DagDetailsProps {
  dagId: string;
  refreshTrigger?: number;
  onActionComplete?: () => void;
}

export function DagDetails({ dagId, refreshTrigger: parentRefreshTrigger, onActionComplete }: DagDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [dag, setDag] = useState<DAGDetailResponse | null>(null);
  const [activeRun, setActiveRun] = useState<DAGRunResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const runDetailsRef = useRef<RunDetailsTabRef>(null);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: 'trigger' | 'pause' | 'unpause' | 'stop' | null;
    title: string;
    description: string;
  }>({
    open: false,
    action: null,
    title: '',
    description: '',
  });

  const [childRefreshTrigger, setChildRefreshTrigger] = useState(0);

  const fetchDagDetails = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const dagData = await getDAG(dagId);
      setDag(dagData);
      
      // Fetch active run (running or queued)
      try {
        const runsData = await listDAGRuns(dagId, { 
          source: 'airflow',
          pageSize: 1 
        });
        const latestRun = runsData.data.length > 0 ? runsData.data[0] : null;
        // Set as active run if running or queued
        if (latestRun && ['running', 'queued'].includes(latestRun.state)) {
          setActiveRun(latestRun);
        } else {
          setActiveRun(null);
        }
      } catch {
        // No active run
        setActiveRun(null);
      }
    } catch (err) {
      console.error('Failed to fetch DAG details:', err);
      // Set a default/fallback state
      setDag({
        dagId,
        name: dagId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: null,
        status: 'active',
        owner: null,
        tags: [],
        timezone: 'Asia/Ho_Chi_Minh',
        scheduleCron: 'manual',
        scheduleLabel: null,
        catchup: false,
        maxActiveRuns: 1,
      });
    } finally {
      setIsLoading(false);
    }
  }, [dagId]);

  useEffect(() => {
    fetchDagDetails();
  }, [fetchDagDetails]);

  // Auto-refresh when there's an active run
  useEffect(() => {
    if (activeRun) {
      const interval = setInterval(() => {
        fetchDagDetails(false);
        setChildRefreshTrigger(prev => prev + 1); // Trigger child refresh
      }, 5000); // Refresh every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [activeRun, fetchDagDetails]);

  // Refresh when parent triggers (e.g., when DagCatalog performs an action)
  useEffect(() => {
    if (parentRefreshTrigger && parentRefreshTrigger > 0) {
      fetchDagDetails(false);
      setChildRefreshTrigger(prev => prev + 1);
    }
  }, [parentRefreshTrigger, fetchDagDetails]);

  const handleViewLogs = () => {
    setActiveTab('details');
    // Small delay to ensure tab content is mounted
    setTimeout(() => {
      runDetailsRef.current?.navigateToLogs();
    }, 100);
  };

  const handleNavigateToRunDetails = (runId: string) => {
    setActiveTab('details');
    // Small delay to ensure tab content is mounted
    setTimeout(() => {
      runDetailsRef.current?.navigateToLogs();
    }, 100);
  };

  const handleTriggerRun = () => {
    if (!dag) return;
    setConfirmDialog({
      open: true,
      action: 'trigger',
      title: `Trigger run — ${dag.name}?`,
      description: 'Do you want to proceed?',
    });
  };

  const handlePause = () => {
    if (!dag) return;
    const isPaused = dag.status === 'paused';
    if (isPaused) {
      setConfirmDialog({
        open: true,
        action: 'unpause',
        title: `Resume — ${dag.name}?`,
        description: 'Do you want to proceed?',
      });
    } else {
      setConfirmDialog({
        open: true,
        action: 'pause',
        title: `Pause — ${dag.name}?`,
        description: 'Do you want to proceed?',
      });
    }
  };

  const handleStopRun = () => {
    if (!dag) return;
    setConfirmDialog({
      open: true,
      action: 'stop',
      title: `Stop active run — ${dag.name}?`,
      description: 'Do you want to proceed?',
    });
  };

  const executeAction = async () => {
    const action = confirmDialog.action;
    setConfirmDialog({ open: false, action: null, title: '', description: '' });
    
    if (!dag) return;
    
    try {
      setActionLoading(action);
      
      switch (action) {
        case 'trigger':
          await triggerDAGRun(dagId);
          toast.success('Run triggered successfully');
          break;
        case 'pause':
          await pauseDAG(dagId, true);
          toast.success('DAG paused successfully');
          break;
        case 'unpause':
          await pauseDAG(dagId, false);
          toast.success('DAG resumed successfully');
          break;
        case 'stop':
          if (activeRun) {
            await stopDAGRun(dagId, activeRun.runId);
            toast.success('Active run stopped');
          } else {
            toast.error('No active run to stop');
          }
          break;
      }
      
      // Refresh DAG details and trigger child refresh
      fetchDagDetails(false);
      setChildRefreshTrigger(prev => prev + 1);
      // Notify parent to refresh other components (e.g., DagCatalog)
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-16" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-36" />
            </div>
            <div className="flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </Card>
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!dag) return null;

  const isPaused = dag.status === 'paused';

  return (
    <div className="space-y-4">
      {/* DAG Header */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-gray-900">{dag.name}</h2>
            <Badge
              variant="default"
              className={
                isPaused
                  ? 'bg-gray-100 text-gray-700 border-gray-200'
                  : 'bg-green-100 text-green-700 border-green-200'
              }
            >
              {isPaused ? 'Paused' : 'Active'}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleTriggerRun} 
              className={activeRun ? 'cursor-not-allowed' : 'cursor-pointer'}
              disabled={actionLoading !== null || !!activeRun}
            >
              {actionLoading === 'trigger' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : activeRun ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              {activeRun ? 'Running...' : 'Trigger Run'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handlePause} 
              className={!activeRun ? 'cursor-not-allowed' : 'cursor-pointer'}
              disabled={actionLoading !== null || !activeRun}
            >
              {(actionLoading === 'pause' || actionLoading === 'unpause') ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Pause className="w-4 h-4 mr-2" />
              )}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button 
              variant="outline" 
              className="text-red-600 hover:text-red-700 cursor-pointer"
              onClick={handleStopRun}
              disabled={actionLoading !== null || !activeRun}
            >
              {actionLoading === 'stop' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <StopCircle className="w-4 h-4 mr-2" />
              )}
              Stop Active Run
            </Button>
          </div>

          <div className="flex gap-4 text-sm text-gray-600">
            <div>
              <span className="text-gray-500">Owner:</span> {dag.owner || 'N/A'}
            </div>
            <div>
              <span className="text-gray-500">Tags:</span> {dag.tags.length > 0 ? dag.tags.join(', ') : 'N/A'}
            </div>
            <div>
              <span className="text-gray-500">Timezone:</span> {dag.timezone}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="history">Run History</TabsTrigger>
          <TabsTrigger value="details">Run Details</TabsTrigger>
          <TabsTrigger value="edit">Edit DAG</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab dagId={dagId} onViewLogs={handleViewLogs} refreshTrigger={childRefreshTrigger} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <RunHistoryTab dagId={dagId} onNavigateToRunDetails={handleNavigateToRunDetails} refreshTrigger={childRefreshTrigger} />
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <RunDetailsTab dagId={dagId} ref={runDetailsRef} refreshTrigger={childRefreshTrigger} />
        </TabsContent>

        <TabsContent value="edit" className="mt-4">
          <EditDagTab dagId={dagId} />
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog({ ...confirmDialog, open })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={executeAction}
              className={confirmDialog.action === 'stop' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {confirmDialog.action === 'stop' ? 'Yes, stop run' : 'Yes, proceed'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
