import { useState } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { CheckCircle2, Copy, Download } from 'lucide-react';

interface RunDetailsTabProps {
  dagId: string;
}

export function RunDetailsTab({ dagId }: RunDetailsTabProps) {
  const [detailTab, setDetailTab] = useState('graph');

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
            <span className="text-gray-900">3m 24s</span>
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
              {/* Simplified DAG Graph */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-16 bg-green-100 border-2 border-green-600 rounded flex items-center justify-center">
                    <span className="text-sm text-green-900">start</span>
                  </div>
                </div>
                <div className="text-gray-400">→</div>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-16 bg-green-100 border-2 border-green-600 rounded flex items-center justify-center">
                    <span className="text-sm text-green-900">fetch_api</span>
                  </div>
                </div>
                <div className="text-gray-400">→</div>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-16 bg-green-100 border-2 border-green-600 rounded flex items-center justify-center">
                    <span className="text-sm text-green-900">transform</span>
                  </div>
                </div>
                <div className="text-gray-400">→</div>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-16 bg-green-100 border-2 border-green-600 rounded flex items-center justify-center">
                    <span className="text-sm text-green-900">upsert_db</span>
                  </div>
                </div>
                <div className="text-gray-400">→</div>
                <div className="flex flex-col items-center">
                  <div className="w-20 h-16 bg-green-100 border-2 border-green-600 rounded flex items-center justify-center">
                    <span className="text-sm text-green-900">end</span>
                  </div>
                </div>
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
              {[
                { task: 'start', start: '17:00:02', end: '17:00:03', duration: '1s' },
                { task: 'fetch_api', start: '17:00:03', end: '17:02:15', duration: '2m 12s' },
                { task: 'transform', start: '17:02:15', end: '17:02:48', duration: '33s' },
                { task: 'upsert_db', start: '17:02:48', end: '17:03:24', duration: '36s' },
                { task: 'end', start: '17:03:24', end: '17:03:26', duration: '2s' },
              ].map((item, idx) => (
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
                      style={{ width: `${Math.min((idx + 1) * 20, 100)}%` }}
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
                <Button variant="outline" size="sm">
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
              <div className="space-y-1">
                <div>[2025-11-01 17:00:02] INFO - Starting DAG vn30_data_crawler</div>
                <div>[2025-11-01 17:00:03] INFO - Task start completed</div>
                <div>[2025-11-01 17:00:03] INFO - Executing task fetch_api</div>
                <div>[2025-11-01 17:00:05] INFO - Connecting to VNDirect API...</div>
                <div>[2025-11-01 17:00:12] INFO - Fetching data for 10 tickers</div>
                <div>[2025-11-01 17:01:24] INFO - Retrieved 240 days of data</div>
                <div>[2025-11-01 17:02:15] INFO - Task fetch_api completed successfully</div>
                <div>[2025-11-01 17:02:15] INFO - Executing task transform</div>
                <div>[2025-11-01 17:02:18] INFO - Normalizing price data...</div>
                <div>[2025-11-01 17:02:35] INFO - Calculating volume metrics...</div>
                <div>[2025-11-01 17:02:48] INFO - Task transform completed successfully</div>
                <div>[2025-11-01 17:02:48] INFO - Executing task upsert_db</div>
                <div>[2025-11-01 17:02:52] INFO - Connecting to PostgreSQL...</div>
                <div>[2025-11-01 17:03:05] INFO - Upserting 2,400 records...</div>
                <div>[2025-11-01 17:03:24] INFO - Task upsert_db completed successfully</div>
                <div>[2025-11-01 17:03:24] INFO - Executing task end</div>
                <div className="text-green-400">
                  [2025-11-01 17:03:26] INFO - DAG run completed successfully
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
