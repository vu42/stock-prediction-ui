import { useState, useCallback } from 'react';
import { DagCatalog } from '../pipelines/DagCatalog';
import { DagDetails } from '../pipelines/DagDetails';

export function PipelinesPage() {
  const [selectedDag, setSelectedDag] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Callback to trigger refresh in both components when an action is completed
  const handleActionComplete = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Column - DAG Catalog (40%) */}
      <div className="w-[40%] overflow-y-auto px-8 py-6">
        <DagCatalog 
          selectedDag={selectedDag} 
          onSelectDag={setSelectedDag} 
          refreshTrigger={refreshTrigger}
          onActionComplete={handleActionComplete}
        />
      </div>

      {/* Vertical Divider */}
      <div className="w-px bg-gray-200" />

      {/* Right Column - DAG Details (60%) */}
      <div className="w-[60%] overflow-y-auto px-8 py-6">
        <DagDetails 
          dagId={selectedDag} 
          refreshTrigger={refreshTrigger}
          onActionComplete={handleActionComplete}
        />
      </div>
    </div>
  );
}
