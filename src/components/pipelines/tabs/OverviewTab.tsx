import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Progress } from "../../ui/progress";
import {
  Eye,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

interface OverviewTabProps {
  dagId: string;
}

export function OverviewTab({ dagId }: OverviewTabProps) {
  const isRunning = false; // Toggle this to show running state

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
                className="flex-1"
              >
                <Eye className="w-3 h-3 mr-1" />
                View logs
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Play className="w-3 h-3 mr-1" />
                Rerun with same conf
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Recent 5 runs - Only show for vn30_data_crawler */}
      {/* {dagId === 'vn30_data_crawler' && (
        <Card className="p-4">
          <h3 className="mb-3">Recent 5 runs</h3>
          <div className="space-y-2">
            {[
              {
                runId: 'scheduled__2025-11-01T17:00',
                start: '2025-11-01 17:00:02',
                duration: '3m 24s',
                state: 'Success',
              },
              {
                runId: 'scheduled__2025-10-31T17:00',
                start: '2025-10-31 17:00:01',
                duration: '3m 18s',
                state: 'Success',
              },
              {
                runId: 'scheduled__2025-10-30T17:00',
                start: '2025-10-30 17:00:03',
                duration: '4m 12s',
                state: 'Success',
              },
              {
                runId: 'scheduled__2025-10-29T17:00',
                start: '2025-10-29 17:00:01',
                duration: '—',
                state: 'Failed',
              },
              {
                runId: 'scheduled__2025-10-28T17:00',
                start: '2025-10-28 17:00:02',
                duration: '3m 31s',
                state: 'Success',
              },
            ].map((run, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-2 border-b last:border-b-0 text-sm"
              >
                <div className="flex-1">
                  <div className="font-mono text-xs text-gray-700">{run.runId}</div>
                  <div className="text-xs text-gray-500">{run.start}</div>
                </div>
                <div className="text-gray-600 mx-4">{run.duration}</div>
                <Badge
                  className={
                    run.state === 'Success'
                      ? 'bg-green-100 text-green-700 border-green-200'
                      : run.state === 'Failed'
                      ? 'bg-red-100 text-red-700 border-red-200'
                      : 'bg-blue-100 text-blue-700 border-blue-200'
                  }
                >
                  {run.state === 'Success' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {run.state === 'Failed' && <XCircle className="w-3 h-3 mr-1" />}
                  {run.state === 'Running' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                  {run.state}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )} */}
    </div>
  );
}