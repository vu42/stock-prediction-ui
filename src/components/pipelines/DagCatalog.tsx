import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Play, Pause } from 'lucide-react';

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
  return (
    <div className="space-y-4">
      {dags.map((dag) => (
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
              variant={dag.status === 'Active' ? 'default' : 'secondary'}
              className={
                dag.status === 'Active'
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-gray-100 text-gray-600'
              }
            >
              {dag.status}
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
            <Button size="sm" variant="outline" className="flex-1">
              <Play className="w-3 h-3 mr-1" />
              Run now
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Pause className="w-3 h-3 mr-1" />
              Pause
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
