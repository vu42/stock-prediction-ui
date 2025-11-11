import { useState, forwardRef, useImperativeHandle } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { CheckCircle2, Copy, Download } from 'lucide-react';

interface RunDetailsTabProps {
  dagId: string;
}

export interface RunDetailsTabRef {
  navigateToLogs: () => void;
}

export const RunDetailsTab = forwardRef<RunDetailsTabRef, RunDetailsTabProps>(
  ({ dagId }, ref) => {
    const [detailTab, setDetailTab] = useState('graph');

    useImperativeHandle(ref, () => ({
      navigateToLogs: () => {
        setDetailTab('logs');
      },
    }));

    // Corrected tasks for both DAGs: start → fetch_api → push_to_db → end
    const tasks = ['start', 'fetch_api', 'push_to_db', 'end'];

    const ganttData = [
      { task: 'start', start: '17:00:02', end: '17:00:03', duration: '1s' },
      { task: 'fetch_api', start: '17:00:03', end: '17:02:15', duration: '2m 12s' },
      { task: 'push_to_db', start: '17:02:15', end: '17:02:51', duration: '36s' },
      { task: 'end', start: '17:02:51', end: '17:02:53', duration: '2s' },
    ];

    return (
      <div className="space-y-4">
        {/* Run Header */}
        <Card className="p-4">
          <h3 className="mb-3">Run: scheduled__2025-11-01T17:00</h3>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">State:</span>
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Success
              </Badge>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-600">Duration:</span>
              <span className="text-gray-900">2m 51s</span>
            </div>
            <div className="flex gap-2">
              <span className="text-gray-600">Conf:</span>
              <code className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                {JSON.stringify({ tickers: 'all_vn30' })}
              </code>
            </div>
          </div>
        </Card>

        {/* Sub-tabs */}
        <Tabs value={detailTab} onValueChange={setDetailTab}>
          <TabsList>
            <TabsTrigger value="graph">Graph</TabsTrigger>
            <TabsTrigger value="gantt">Gantt</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="graph" className="mt-4">
            <Card className="p-6">
              <div className="flex items-center justify-center gap-4">
                {/* DAG Graph: start → fetch_api → push_to_db → end */}
                <div className="flex items-center gap-3">
                  {tasks.map((task, idx) => (
                    <div key={task} className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-24 h-16 bg-green-100 border-2 border-green-600 rounded flex items-center justify-center">
                          <span className="text-sm text-green-900">{task}</span>
                        </div>
                      </div>
                      {idx < tasks.length - 1 && (
                        <div className="text-gray-400">→</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-center text-sm text-gray-500 mt-4">
                All tasks completed successfully
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="gantt" className="mt-4">
            <Card className="p-4">
              <div className="space-y-3">
                {ganttData.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">{item.task}</span>
                      <span className="text-gray-500">
                        {item.start} → {item.end} ({item.duration})
                      </span>
                    </div>
                    <div className="bg-gray-200 h-6 rounded overflow-hidden">
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: `${Math.min((idx + 1) * 25, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <Card className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm">Task Logs</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="cursor-pointer">
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" className="cursor-pointer">
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                <div className="space-y-1">
                  <div>[2025-11-01 17:00:02] INFO — DAG start</div>
                  <div>[2025-11-01 17:00:03] INFO — Executing task fetch_api</div>
                  <div>[2025-11-01 17:02:15] INFO — fetch_api completed successfully</div>
                  <div>[2025-11-01 17:02:15] INFO — Executing task push_to_db</div>
                  <div>[2025-11-01 17:02:51] INFO — push_to_db completed successfully</div>
                  <div className="text-green-400">
                    [2025-11-01 17:02:53] INFO — DAG run completed successfully
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
);

RunDetailsTab.displayName = 'RunDetailsTab';
