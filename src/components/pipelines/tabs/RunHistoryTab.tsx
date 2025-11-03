import { Card } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Eye, Play, StopCircle, CheckCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface RunHistoryTabProps {
  dagId: string;
}

export function RunHistoryTab({ dagId }: RunHistoryTabProps) {
  const runs = [
    {
      runId: 'manual__2025-11-02T14:32',
      start: '2025-11-02 14:32:15',
      end: '—',
      duration: '—',
      triggeredBy: 'user@data-eng',
      state: 'Running',
    },
    {
      runId: 'scheduled__2025-11-01T17:00',
      start: '2025-11-01 17:00:02',
      end: '2025-11-01 17:03:26',
      duration: '3m 24s',
      triggeredBy: 'scheduler',
      state: 'Success',
    },
    {
      runId: 'scheduled__2025-10-31T17:00',
      start: '2025-10-31 17:00:01',
      end: '2025-10-31 17:03:19',
      duration: '3m 18s',
      triggeredBy: 'scheduler',
      state: 'Success',
    },
    {
      runId: 'scheduled__2025-10-30T17:00',
      start: '2025-10-30 17:00:03',
      end: '2025-10-30 17:04:15',
      duration: '4m 12s',
      triggeredBy: 'scheduler',
      state: 'Success',
    },
    {
      runId: 'scheduled__2025-10-29T17:00',
      start: '2025-10-29 17:00:01',
      end: '2025-10-29 17:02:45',
      duration: '2m 44s',
      triggeredBy: 'scheduler',
      state: 'Failed',
    },
    {
      runId: 'scheduled__2025-10-28T17:00',
      start: '2025-10-28 17:00:02',
      end: '2025-10-28 17:03:33',
      duration: '3m 31s',
      triggeredBy: 'scheduler',
      state: 'Success',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1.5 block">Date range</label>
            <Input type="text" placeholder="2025-10-01 to 2025-11-02" />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1.5 block">State</label>
            <Select defaultValue="all">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All states</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1.5 block">Search run_id</label>
            <Input type="text" placeholder="scheduled__2025..." />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>run_id</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Triggered by</TableHead>
                <TableHead>State</TableHead>
                {dagId !== 'vn30_data_crawler' && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-mono text-xs">{run.runId}</TableCell>
                  <TableCell className="text-sm">{run.start}</TableCell>
                  <TableCell className="text-sm">{run.end}</TableCell>
                  <TableCell className="text-sm">{run.duration}</TableCell>
                  <TableCell className="text-sm">{run.triggeredBy}</TableCell>
                  <TableCell>
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
                  </TableCell>
                  {dagId !== 'vn30_data_crawler' && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-3 h-3" />
                        </Button>
                        {run.state === 'Running' ? (
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <StopCircle className="w-3 h-3" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm">
                            <Play className="w-3 h-3" />
                          </Button>
                        )}
                        {run.state === 'Failed' && (
                          <Button variant="ghost" size="sm" disabled>
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">Showing 1-6 of 42 runs</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
