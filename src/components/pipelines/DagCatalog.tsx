import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
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
import { Play, Pause } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface DagCatalogProps {
  selectedDag: string;
  onSelectDag: (dagId: string) => void;
}

const dags = [
  {
    id: 'vn30_data_crawler',
    name: 'vn30_data_crawler',
    description: 'Fetch daily trading data from VNDirect API (5PM).',
    schedule: '0 17 * * * (daily 17:00)',
    status: 'Active',
    nextRun: 'Today 17:00',
    lastRun: '2025-11-01 17:00 — Success',
  },
  {
    id: 'vn30_model_training',
    name: 'vn30_model_training',
    description: 'Train ensemble regression models and generate predictions (6PM).',
    schedule: '0 18 * * * (daily 18:00)',
    status: 'Active',
    nextRun: 'Today 18:00',
    lastRun: '2025-11-01 18:20 — Success',
  },
];

export function DagCatalog({ selectedDag, onSelectDag }: DagCatalogProps) {
  const [pausedDags, setPausedDags] = useState<Set<string>>(new Set());
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

  const handleRunNow = (e: React.MouseEvent, dagId: string, dagName: string) => {
    e.stopPropagation();
    setConfirmDialog({
      open: true,
      action: 'run',
      dagId,
      dagName,
    });
  };

  const handlePause = (e: React.MouseEvent, dagId: string, dagName: string) => {
    e.stopPropagation();
    const isPaused = pausedDags.has(dagId);
    setConfirmDialog({
      open: true,
      action: isPaused ? 'unpause' : 'pause',
      dagId,
      dagName,
    });
  };

  const executeAction = () => {
    const { action, dagId } = confirmDialog;
    
    switch (action) {
      case 'run':
        toast.success('Run triggered successfully.');
        break;
      case 'pause':
        setPausedDags(new Set([...pausedDags, dagId]));
        toast.success('DAG paused successfully.');
        break;
      case 'unpause':
        const newPaused = new Set(pausedDags);
        newPaused.delete(dagId);
        setPausedDags(newPaused);
        toast.success('DAG unpaused successfully.');
        break;
    }
    
    setConfirmDialog({ open: false, action: null, dagId: '', dagName: '' });
  };

  return (
    <div className="space-y-4">
      {dags.map((dag) => {
        const isPaused = pausedDags.has(dag.id);
        return (
          <Card
            key={dag.id}
            className={`p-4 cursor-pointer transition-all ${
              selectedDag === dag.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => onSelectDag(dag.id)}
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
                {isPaused ? 'Paused' : dag.status}
              </Badge>
            </div>

            <p className="text-sm text-gray-600 mb-3">{dag.description}</p>

            <div className="space-y-1.5 mb-3 text-sm">
              <div className="flex gap-2">
                <span className="text-gray-600">Schedule:</span>
                <span className="text-gray-900 font-mono">{dag.schedule}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Next run:</span>
                <span className="text-gray-900">{dag.nextRun}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-600">Last run:</span>
                <span className="text-gray-900">{dag.lastRun}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 cursor-pointer"
                onClick={(e) => handleRunNow(e, dag.id, dag.name)}
              >
                <Play className="w-3 h-3 mr-1" />
                Run now
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 cursor-pointer"
                onClick={(e) => handlePause(e, dag.id, dag.name)}
              >
                <Pause className="w-3 h-3 mr-1" />
                {isPaused ? 'Unpause' : 'Pause'}
              </Button>
            </div>
          </Card>
        );
      })}

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => 
        setConfirmDialog({ ...confirmDialog, open })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'run' && `Run now — ${confirmDialog.dagName}?`}
              {confirmDialog.action === 'pause' && `Pause — ${confirmDialog.dagName}?`}
              {confirmDialog.action === 'unpause' && `Unpause — ${confirmDialog.dagName}?`}
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
