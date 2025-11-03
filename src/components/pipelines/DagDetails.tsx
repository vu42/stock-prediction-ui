import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { OverviewTab } from './tabs/OverviewTab';
import { RunHistoryTab } from './tabs/RunHistoryTab';
import { RunDetailsTab } from './tabs/RunDetailsTab';
import { EditDagTab } from './tabs/EditDagTab';
import { Play, Pause, StopCircle } from 'lucide-react';

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
  const dag = dagInfo[dagId as keyof typeof dagInfo];

  if (!dag) return null;

  return (
    <div className="space-y-4">
      {/* DAG Header */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-gray-900">{dag.name}</h2>
            <Badge
              variant="default"
              className="bg-green-100 text-green-700 border-green-200"
            >
              {dag.status}
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button>
              <Play className="w-4 h-4 mr-2" />
              Trigger Run
            </Button>
            <Button variant="outline">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
            <Button variant="outline" className="text-red-600 hover:text-red-700">
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
          <OverviewTab dagId={dagId} />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <RunHistoryTab dagId={dagId} />
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <RunDetailsTab dagId={dagId} />
        </TabsContent>

        <TabsContent value="edit" className="mt-4">
          <EditDagTab dagId={dagId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
