import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Skeleton } from '../../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { CheckCircle2, XCircle, Copy, Download, Loader2, Clock, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  listDAGRuns,
  getRunGraph,
  getRunGantt,
  getRunLogs,
  type DAGRunResponse,
  type GraphResponse,
  type GanttResponse,
  type LogsResponse,
} from '../../../api/pipelinesApi';

interface RunDetailsTabProps {
  dagId: string;
  selectedRunId?: string | null;
  refreshTrigger?: number;
}

export interface RunDetailsTabRef {
  navigateToLogs: () => void;
}

export const RunDetailsTab = forwardRef<RunDetailsTabRef, RunDetailsTabProps>(
  ({ dagId, selectedRunId, refreshTrigger }, ref) => {
    const [detailTab, setDetailTab] = useState('graph');
    const [latestRun, setLatestRun] = useState<DAGRunResponse | null>(null);
    const [graph, setGraph] = useState<GraphResponse | null>(null);
    const [gantt, setGantt] = useState<GanttResponse | null>(null);
    const [logs, setLogs] = useState<LogsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    useImperativeHandle(ref, () => ({
      navigateToLogs: () => {
        setDetailTab('logs');
      },
    }));

    const fetchRunDetails = useCallback(async (showLoading = true) => {
      try {
        if (showLoading) setIsLoading(true);
        else setIsRefreshing(true);
        
        let run: DAGRunResponse | null = null;
        
        if (selectedRunId) {
          // Fetch specific run by searching for it
          const runsData = await listDAGRuns(dagId, { 
            source: 'airflow',
            searchRunId: selectedRunId,
            pageSize: 10 
          });
          run = runsData.data.find(r => r.runId === selectedRunId) || runsData.data[0] || null;
        } else {
          // Get latest run
          const runsData = await listDAGRuns(dagId, { 
            source: 'airflow',
            pageSize: 1 
          });
          run = runsData.data[0] || null;
        }
        
        if (!run) {
          setLatestRun(null);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
        
        setLatestRun(run);
        
        // Fetch graph, gantt, logs in parallel
        try {
          const [graphData, ganttData, logsData] = await Promise.all([
            getRunGraph(run.runId, dagId, 'airflow').catch(() => null),
            getRunGantt(run.runId, dagId, 'airflow').catch(() => null),
            getRunLogs(run.runId, dagId, { source: 'airflow' }).catch(() => null),
          ]);
          
          setGraph(graphData);
          setGantt(ganttData);
          setLogs(logsData);
        } catch {
          // Silently fail for sub-data
        }
      } catch (err) {
        console.error('Failed to fetch run details:', err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }, [dagId, selectedRunId]);

    useEffect(() => {
      fetchRunDetails();
    }, [fetchRunDetails]);

    // Refresh when parent triggers
    useEffect(() => {
      if (refreshTrigger && refreshTrigger > 0) {
        fetchRunDetails(false);
      }
    }, [refreshTrigger]);

    // Auto-refresh when run is in progress
    useEffect(() => {
      const isRunInProgress = latestRun && ['running', 'queued'].includes(latestRun.state);
      
      if (isRunInProgress) {
        const interval = setInterval(() => {
          fetchRunDetails(false);
        }, 5000);
        
        return () => clearInterval(interval);
      }
    }, [latestRun, fetchRunDetails]);

    const formatDuration = (seconds: number | null) => {
      if (seconds === null || seconds === undefined) return 'N/A';
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    };

    const getStateBadge = (state: string) => {
      switch (state?.toLowerCase()) {
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
              {state || 'Unknown'}
            </Badge>
          );
      }
    };

    const getTaskBorderClass = (state: string) => {
      switch (state?.toLowerCase()) {
        case 'success':
          return 'bg-green-100 border-green-600 text-green-900';
        case 'failed':
          return 'bg-red-100 border-red-600 text-red-900';
        case 'running':
          return 'bg-blue-100 border-blue-600 text-blue-900';
        case 'queued':
          return 'bg-yellow-100 border-yellow-600 text-yellow-900';
        default:
          return 'bg-gray-100 border-gray-400 text-gray-700';
      }
    };

    const handleCopyLogs = () => {
      if (logs?.entries) {
        const logText = logs.entries.map(e => `[${e.timestamp}] ${e.level} - ${e.message}`).join('\n');
        navigator.clipboard.writeText(logText);
        toast.success('Logs copied to clipboard');
      }
    };

    const handleDownloadLogs = () => {
      if (logs?.entries) {
        const logText = logs.entries.map(e => `[${e.timestamp}] ${e.level} - ${e.message}`).join('\n');
        const blob = new Blob([logText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dagId}_${latestRun?.runId}_logs.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    };

    if (isLoading) {
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <Skeleton className="h-6 w-64 mb-3" />
            <div className="flex gap-4">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-48" />
            </div>
          </Card>
          <Skeleton className="h-10 w-48" />
          <Card className="p-6">
            <Skeleton className="h-32 w-full" />
          </Card>
        </div>
      );
    }

    if (!latestRun) {
      return (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No runs available for this DAG.</p>
        </Card>
      );
    }

    const isRunInProgress = ['running', 'queued'].includes(latestRun.state);

    return (
      <div className="space-y-4">
        {/* Auto-refresh indicator */}
        {isRunInProgress && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Auto-refreshing every 5 seconds...
          </div>
        )}

        {/* Run Header */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3>Run: {latestRun.runId}</h3>
            {isRefreshing && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">State:</span>
              {getStateBadge(latestRun.state)}
            </div>
            <div className="flex gap-2">
              <span className="text-gray-600">Duration:</span>
              <span className="text-gray-900">{formatDuration(latestRun.durationSeconds)}</span>
            </div>
            {latestRun.conf && Object.keys(latestRun.conf).length > 0 && (
              <div className="flex gap-2">
                <span className="text-gray-600">Conf:</span>
                <code className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">
                  {JSON.stringify(latestRun.conf)}
                </code>
              </div>
            )}
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
              {graph && graph.nodes.length > 0 ? (
                <>
                  <div className="flex items-center justify-center gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap justify-center">
                      {graph.nodes.map((node, idx) => (
                        <div key={node.id} className="flex items-center gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-24 h-16 border-2 rounded flex items-center justify-center ${getTaskBorderClass(node.state)}`}>
                              <span className="text-sm">{node.label}</span>
                            </div>
                          </div>
                          {idx < graph.nodes.length - 1 && (
                            <div className="text-gray-400">→</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-4">
                    {latestRun.state === 'success' && 'All tasks completed successfully'}
                    {latestRun.state === 'running' && 'Tasks are running...'}
                    {latestRun.state === 'queued' && 'Waiting to start...'}
                    {latestRun.state === 'failed' && 'Some tasks failed'}
                  </p>
                </>
              ) : (
                <p className="text-center text-gray-500">No task graph available</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="gantt" className="mt-4">
            <Card className="p-4">
              {gantt && gantt.tasks.length > 0 ? (
                <div className="space-y-3">
                  {gantt.tasks.map((task, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{task.label}</span>
                        <span className="text-gray-500">
                          {task.start ? new Date(task.start).toLocaleTimeString() : '—'} → {' '}
                          {task.end ? new Date(task.end).toLocaleTimeString() : '—'}
                        </span>
                      </div>
                      <div className="bg-gray-200 h-6 rounded overflow-hidden">
                        <div
                          className={`h-full ${
                            task.state === 'success' ? 'bg-green-500' :
                            task.state === 'failed' ? 'bg-red-500' :
                            task.state === 'running' ? 'bg-blue-500 animate-pulse' :
                            'bg-gray-400'
                          }`}
                          style={{ width: task.state === 'success' ? '100%' : task.state === 'running' ? '50%' : '0%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">No Gantt data available</p>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <Card className="p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm">Task Logs</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="cursor-pointer" onClick={handleCopyLogs}>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" className="cursor-pointer" onClick={handleDownloadLogs}>
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-xs overflow-x-auto max-h-96 overflow-y-auto">
                {logs && logs.entries.length > 0 ? (
                  <div className="space-y-1">
                    {logs.entries.map((entry, idx) => (
                      <div 
                        key={idx} 
                        className={
                          entry.level === 'ERROR' ? 'text-red-400' :
                          entry.level === 'WARNING' ? 'text-yellow-400' :
                          entry.message.includes('completed successfully') ? 'text-green-400' :
                          ''
                        }
                      >
                        [{new Date(entry.timestamp).toLocaleString()}] {entry.level} — {entry.message}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No logs available</p>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
);

RunDetailsTab.displayName = 'RunDetailsTab';
