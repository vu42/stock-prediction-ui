import { useState, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
import { Play, Pause, StopCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface DagDetailsProps {
  dagId: string;
}

const dagInfo = {
  vn30_data_crawler: {
    name: 'vn30_data_crawler',
    status: 'Active',
    owner: 'data-eng',
    tags: ['ingestion', 'vn30'],
    timezone: 'Asia/Ho_Chi_Minh',
  },
  vn30_model_training: {
    name: 'vn30_model_training',
    status: 'Active',
    owner: 'data-eng',
    tags: ['ml', 'vn30'],
    timezone: 'Asia/Ho_Chi_Minh',
  },
};

export function DagDetails({ dagId }: DagDetailsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isPaused, setIsPaused] = useState(false);
  const runDetailsRef = useRef<RunDetailsTabRef>(null);
  const dag = dagInfo[dagId as keyof typeof dagInfo];

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

  if (!dag) return null;

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
    setConfirmDialog({
      open: true,
      action: 'trigger',
      title: `Trigger run — ${dag.name}?`,
      description: 'Do you want to proceed?',
    });
  };

  const handlePause = () => {
    if (isPaused) {
      setConfirmDialog({
        open: true,
        action: 'unpause',
        title: `Unpause — ${dag.name}?`,
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
    setConfirmDialog({
      open: true,
      action: 'stop',
      title: `Stop active run — ${dag.name}?`,
      description: 'Do you want to proceed?',
    });
  };

  const executeAction = () => {
    switch (confirmDialog.action) {
      case 'trigger':
        toast.success('Run triggered successfully.');
        break;
      case 'pause':
        setIsPaused(true);
        toast.success('DAG paused successfully.');
        break;
      case 'unpause':
        setIsPaused(false);
        toast.success('DAG unpaused successfully.');
        break;
      case 'stop':
        toast.success('Active run stopped.');
        break;
    }
    setConfirmDialog({ open: false, action: null, title: '', description: '' });
  };

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
              {isPaused ? 'Paused' : dag.status}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleTriggerRun} className="cursor-pointer">
              <Play className="w-4 h-4 mr-2" />
              Trigger Run
            </Button>
            <Button variant="outline" onClick={handlePause} className="cursor-pointer">
              <Pause className="w-4 h-4 mr-2" />
              {isPaused ? 'Unpause' : 'Pause'}
            </Button>
            <Button 
              variant="outline" 
              className="text-red-600 hover:text-red-700 cursor-pointer"
              onClick={handleStopRun}
            >
              <StopCircle className="w-4 h-4 mr-2" />
              Stop Active Run
            </Button>
          </div>

          <div className="flex gap-4 text-sm text-gray-600">
            <div>
              <span className="text-gray-500">Owner:</span> {dag.owner}
            </div>
            <div>
              <span className="text-gray-500">Tags:</span> {dag.tags.join(', ')}
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
          <OverviewTab dagId={dagId} onViewLogs={handleViewLogs} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <RunHistoryTab dagId={dagId} onNavigateToRunDetails={handleNavigateToRunDetails} />
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <RunDetailsTab dagId={dagId} ref={runDetailsRef} />
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
