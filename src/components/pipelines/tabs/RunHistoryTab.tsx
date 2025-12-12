import React, { useState, useEffect, useCallback } from "react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Skeleton } from "../../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  listDAGRuns,
  type DAGRunResponse,
  PipelinesApiError,
} from "../../../api/pipelinesApi";

interface RunHistoryTabProps {
  dagId: string;
  onNavigateToRunDetails?: (runId: string) => void;
  refreshTrigger?: number;
}

type RunState = "running" | "success" | "failed" | "queued";

// Simple DateInput component with validation
function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState("");
  
  useEffect(() => {
    setInputValue(value);
  }, [value]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setError("");
    
    if (newValue === "") {
      onChange("");
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(newValue)) {
      const date = new Date(newValue);
      if (!isNaN(date.getTime())) {
        onChange(newValue);
      } else {
        setError("Invalid date");
      }
    }
  };
  
  const handleBlur = () => {
    if (inputValue && !/^\d{4}-\d{2}-\d{2}$/.test(inputValue)) {
      setError("Format: YYYY-MM-DD");
    }
  };
  
  return (
    <div className="min-w-[140px]">
      <label className="text-sm text-gray-600 mb-1.5 block">
        {label}
      </label>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="YYYY-MM-DD"
        className={`flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

export function RunHistoryTab({
  dagId,
  onNavigateToRunDetails,
  refreshTrigger,
}: RunHistoryTabProps) {
  const [runs, setRuns] = useState<DAGRunResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRuns, setTotalRuns] = useState(0);
  const [selectedStates, setSelectedStates] = useState<Set<RunState>>(new Set());
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const pageSize = 10;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch runs from API
  const fetchRuns = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Build state filter - send comma-separated states
      const stateFilter = selectedStates.size > 0
        ? Array.from(selectedStates).join(',')
        : undefined;
      
      const response = await listDAGRuns(dagId, {
        source: 'airflow',
        state: stateFilter,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        searchRunId: debouncedSearch || undefined,
        page: currentPage,
        pageSize,
      });
      
      setRuns(response.data);
      setTotalRuns(response.meta.total);
    } catch (err) {
      if (err instanceof PipelinesApiError) {
        setError(err.message);
      } else {
        setError('Failed to load runs');
      }
      console.error('Failed to fetch runs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [dagId, currentPage, selectedStates, dateFrom, dateTo, debouncedSearch]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // Refresh when parent triggers
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchRuns();
    }
  }, [refreshTrigger]);

  // Auto-refresh when there are running/queued jobs
  useEffect(() => {
    const hasRunningJobs = runs.some(run => 
      ['running', 'queued'].includes(run.state.toLowerCase())
    );
    
    if (hasRunningJobs) {
      const interval = setInterval(() => {
        fetchRuns();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [runs, fetchRuns]);

  const toggleState = (state: RunState) => {
    const newStates = new Set(selectedStates);
    if (newStates.has(state)) {
      newStates.delete(state);
    } else {
      newStates.add(state);
    }
    setSelectedStates(newStates);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedStates(new Set());
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(totalRuns / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRuns);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleRowClick = (runId: string) => {
    onNavigateToRunDetails?.(runId);
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return "—";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const getStateBadgeClass = (state: string) => {
    switch (state.toLowerCase()) {
      case "success":
        return "bg-green-100 text-green-700 border-green-200";
      case "failed":
        return "bg-red-100 text-red-700 border-red-200";
      case "running":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "queued":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStateIcon = (state: string) => {
    switch (state.toLowerCase()) {
      case "success":
        return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case "failed":
        return <XCircle className="w-3 h-3 mr-1" />;
      case "running":
        return <Loader2 className="w-3 h-3 mr-1 animate-spin" />;
      default:
        return null;
    }
  };

  const stateOptions: RunState[] = [
    "running",
    "success",
    "failed",
    "queued",
  ];

  const stateDisplayNames: Record<RunState, string> = {
    running: "Running",
    success: "Success",
    failed: "Failed",
    queued: "Queued",
  };

  // Loading state
  if (isLoading && runs.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <Skeleton className="h-32 w-full" />
        </Card>
        <Card className="p-4">
          <Skeleton className="h-64 w-full" />
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <Card className="p-6 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchRuns} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="p-4">
        <div className="space-y-3">
          {/* State filter pills */}
          <div>
            <label className="text-sm text-gray-600 mb-2 block">
              State
            </label>
            <div className="flex flex-wrap gap-2">
              {stateOptions.map((state) => (
                <Badge
                  key={state}
                  variant={
                    selectedStates.has(state)
                      ? "default"
                      : "outline"
                  }
                  className={`cursor-pointer px-3 py-1.5 ${
                    selectedStates.has(state)
                      ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => toggleState(state)}
                >
                  {stateDisplayNames[state]}
                </Badge>
              ))}
            </div>
          </div>

          {/* Date range and search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DateInput
              label="From"
              value={dateFrom}
              onChange={(value) => {
                setDateFrom(value);
                setCurrentPage(1);
              }}
            />
            <DateInput
              label="To"
              value={dateTo}
              onChange={(value) => {
                setDateTo(value);
                setCurrentPage(1);
              }}
            />
            <div>
              <label className="text-sm text-gray-600 mb-1.5 block">
                Search run_id
              </label>
              <Input
                type="text"
                placeholder="scheduled__2025..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Reset button and refresh */}
          <div className="flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchRuns}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-700 cursor-pointer underline"
            >
              Reset filters
            </button>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.length > 0 ? (
                runs.map((run, idx) => (
                  <TableRow
                    key={run.runId || idx}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRowClick(run.runId)}
                  >
                    <TableCell className="font-mono text-xs">
                      {run.runId}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(run.start)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(run.end)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDuration(run.durationSeconds)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {run.triggeredBy}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStateBadgeClass(run.state)}
                      >
                        {getStateIcon(run.state)}
                        {run.state.charAt(0).toUpperCase() + run.state.slice(1)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-gray-500 py-8"
                  >
                    No runs found matching the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-sm text-gray-600">
            Showing{" "}
            {totalRuns > 0 ? startIndex + 1 : 0}–
            {endIndex} of {totalRuns} runs
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1 || isLoading}
              className="cursor-pointer"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={
                currentPage >= totalPages ||
                totalRuns === 0 ||
                isLoading
              }
              className="cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}