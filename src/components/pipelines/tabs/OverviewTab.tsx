import { useState } from "react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
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
} from "lucide-react";
import { toast } from "sonner@2.0.3";

interface OverviewTabProps {
  dagId: string;
  onViewLogs?: () => void;
}

export function OverviewTab({ dagId, onViewLogs }: OverviewTabProps) {
  const isRunning = false; // Toggle this to show running state
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

  const handleRerunConfirm = () => {
    setConfirmDialog({
      open: true,
      action: 'rerun',
      title: `Rerun ${dagId}?`,
      description: 'Do you want to proceed with the same configuration?',
    });
  };

  const executeAction = () => {
    if (confirmDialog.action === 'rerun') {
      toast.success('Rerun scheduled with same configuration.');
    }
    setConfirmDialog({ open: false, action: null, title: '', description: '' });
  };

  return (
    <div className="space-y-4">
      {/* Status & Schedule */}
      <Card className="p-4">
        <h3 className="mb-3">Status & Schedule</h3>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-600">State:</span>
            <Badge className="bg-green-100 text-green-700 border-green-200">
              Active
            </Badge>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-600">Schedule:</span>
            <span className="text-gray-900 font-mono">
              0 17 * * * (daily 17:00)
            </span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-600">Catchup:</span>
            <span className="text-gray-900">Off</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-600">
              Max active runs:
            </span>
            <span className="text-gray-900">1</span>
          </div>
        </div>
      </Card>

      {/* Current/Last Run */}
      <Card className="p-4">
        <h3 className="mb-3">Current/Last Run</h3>

        {isRunning ? (
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm">1) Start</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <Progress value={100} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm">2) Task fetch</span>
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                </div>
                <Progress value={60} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm">3) Write DB</span>
                  <span className="text-sm text-gray-400">
                    Waiting
                  </span>
                </div>
                <Progress value={0} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm">4) Complete</span>
                  <span className="text-sm text-gray-400">
                    Waiting
                  </span>
                </div>
                <Progress value={0} />
              </div>
            </div>

            <p className="text-sm text-gray-600">ETA: ~2 min</p>

            <Button
              variant="outline"
              className="w-full text-red-600 hover:text-red-700"
            >
              Stop Run
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">run_id:</span>
                <span className="text-gray-900 font-mono">
                  scheduled__2025-11-01T17:00
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Duration:</span>
                <span className="text-gray-900">3m 24s</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">State:</span>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Success
                </Badge>
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
              {confirmDialog.action === 'rerun' && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono">
                  {JSON.stringify({ tickers: 'all_vn30' }, null, 2)}
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
