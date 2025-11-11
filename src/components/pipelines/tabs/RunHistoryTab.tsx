import { useState, useEffect, useRef } from "react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";

interface RunHistoryTabProps {
  dagId: string;
  onNavigateToRunDetails?: (runId: string) => void;
}

type RunState = "Running" | "Success" | "Failed" | "Queued";

interface Run {
  runId: string;
  start: string;
  end: string;
  duration: string;
  triggeredBy: string;
  state: RunState;
}

// Generate 28 mock runs for pagination
const generateMockRuns = (): Run[] => {
  const states: RunState[] = [
    "Success",
    "Failed",
    "Running",
    "Queued",
  ];
  const runs: Run[] = [];

  // Current running
  runs.push({
    runId: "manual__2025-11-09T14:32",
    start: "2025-11-09 14:32:15",
    end: "—",
    duration: "—",
    triggeredBy: "user@data-eng",
    state: "Running",
  });

  // Recent successful runs
  for (let i = 8; i >= 1; i--) {
    const day = i.toString().padStart(2, "0");
    const date = `2025-11-${day}`;
    runs.push({
      runId: `scheduled__${date}T17:00`,
      start: `${date} 17:00:0${Math.floor(Math.random() * 9) + 1}`,
      end: `${date} 17:0${Math.floor(Math.random() * 4) + 2}:${Math.floor(
        Math.random() * 60,
      )}`,
      duration: `${Math.floor(Math.random() * 2) + 2}m ${Math.floor(
        Math.random() * 60,
      )}s`,
      triggeredBy: "scheduler",
      state: i === 6 || i === 3 ? "Failed" : "Success",
    });
  }

  // October runs
  for (let i = 31; i >= 15; i--) {
    const state =
      i === 29 || i === 22 || i === 18
        ? "Failed"
        : i === 16
          ? "Queued"
          : "Success";
    runs.push({
      runId: `scheduled__2025-10-${i}T17:00`,
      start: `2025-10-${i} 17:00:0${Math.floor(Math.random() * 9) + 1}`,
      end:
        state === "Queued"
          ? "—"
          : `2025-10-${i} 17:0${Math.floor(Math.random() * 4) + 2}:${Math.floor(
              Math.random() * 60,
            )}`,
      duration:
        state === "Queued"
          ? "—"
          : `${Math.floor(Math.random() * 3) + 2}m ${Math.floor(
              Math.random() * 60,
            )}s`,
      triggeredBy: "scheduler",
      state: state,
    });
  }

  return runs;
};

// Custom DateInput component with calendar icon as end-adornment
function DateInput({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleIconClick = () => {
    inputRef.current?.showPicker?.();
  };

  const handleIconKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      inputRef.current?.showPicker?.();
    }
  };

  return (
    <div>
      <label className="text-sm text-gray-600 mb-1.5 block">
        {label}
      </label>
      <div className="relative">
        <style>{`
          input[type="date"]::-webkit-calendar-picker-indicator {
            display: none;
            -webkit-appearance: none;
          }
        `}</style>
        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          min={min}
          max={max}
          className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive pr-10"
          style={{
            colorScheme: "light",
          }}
        />
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleIconClick}
                onKeyDown={handleIconKeyDown}
                aria-label="Open calendar"
                className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer text-[#6B7280] hover:text-[#111827] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded transition-colors"
                tabIndex={0}
              >
                <Calendar className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open calendar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export function RunHistoryTab({
  dagId,
  onNavigateToRunDetails,
}: RunHistoryTabProps) {
  const [allRuns] = useState<Run[]>(generateMockRuns());
  const [filteredRuns, setFilteredRuns] =
    useState<Run[]>(allRuns);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStates, setSelectedStates] = useState<
    Set<RunState>
  >(new Set());
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

  // Apply filters
  useEffect(() => {
    let filtered = [...allRuns];

    // State filter
    if (selectedStates.size > 0) {
      filtered = filtered.filter((run) =>
        selectedStates.has(run.state),
      );
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter((run) => {
        const runDate = run.start.split(" ")[0];
        return runDate >= dateFrom;
      });
    }
    if (dateTo) {
      filtered = filtered.filter((run) => {
        const runDate = run.start.split(" ")[0];
        return runDate <= dateTo;
      });
    }

    // Search filter
    if (debouncedSearch) {
      filtered = filtered.filter((run) =>
        run.runId
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase()),
      );
    }
    setFilteredRuns(filtered);
    setCurrentPage(1);
  }, [
    selectedStates,
    dateFrom,
    dateTo,
    debouncedSearch,
    allRuns,
  ]);

  const toggleState = (state: RunState) => {
    const newStates = new Set(selectedStates);
    if (newStates.has(state)) {
      newStates.delete(state);
    } else {
      newStates.add(state);
    }
    setSelectedStates(newStates);
  };

  const resetFilters = () => {
    setSelectedStates(new Set());
    setDateFrom("");
    setDateTo("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Pagination
  const totalPages = Math.ceil(filteredRuns.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(
    startIndex + pageSize,
    filteredRuns.length,
  );
  const currentRuns = filteredRuns.slice(startIndex, endIndex);

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

  const handleRunIdClick = (
    e: React.MouseEvent,
    runId: string,
  ) => {
    e.stopPropagation();
    onNavigateToRunDetails?.(runId);
  };

  const getStateBadgeClass = (state: RunState) => {
    switch (state) {
      case "Success":
        return "bg-green-100 text-green-700 border-green-200";
      case "Failed":
        return "bg-red-100 text-red-700 border-red-200";
      case "Running":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "Queued":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStateIcon = (state: RunState) => {
    switch (state) {
      case "Success":
        return <CheckCircle2 className="w-3 h-3 mr-1" />;
      case "Failed":
        return <XCircle className="w-3 h-3 mr-1" />;
      case "Running":
        return (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        );
      default:
        return null;
    }
  };

  const stateOptions: RunState[] = [
    "Running",
    "Success",
    "Failed",
    "Queued",
  ];

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
                  {state}
                </Badge>
              ))}
            </div>
          </div>

          {/* Date range and search */}
          <div className="grid grid-cols-3 gap-4">
            <DateInput
              label="From"
              value={dateFrom}
              onChange={setDateFrom}
              max={dateTo || undefined}
            />
            <DateInput
              label="To"
              value={dateTo}
              onChange={setDateTo}
              min={dateFrom || undefined}
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

          {/* Reset button */}
          <div className="flex justify-end">
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
              {currentRuns.length > 0 ? (
                currentRuns.map((run, idx) => (
                  <TableRow
                    key={idx}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <TableCell className="font-mono text-xs">
                      {run.runId}
                    </TableCell>
                    <TableCell className="text-sm">
                      {run.start}
                    </TableCell>
                    <TableCell className="text-sm">
                      {run.end}
                    </TableCell>
                    <TableCell className="text-sm">
                      {run.duration}
                    </TableCell>
                    <TableCell className="text-sm">
                      {run.triggeredBy}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStateBadgeClass(
                          run.state,
                        )}
                      >
                        {getStateIcon(run.state)}
                        {run.state}
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
            {filteredRuns.length > 0 ? startIndex + 1 : 0}–
            {endIndex} of {filteredRuns.length} runs
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
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
                filteredRuns.length === 0
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