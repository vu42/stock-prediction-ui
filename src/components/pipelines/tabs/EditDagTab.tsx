import React, { useState, useEffect, useCallback } from "react";
import { Card } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Checkbox } from "../../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Badge } from "../../ui/badge";
import { Skeleton } from "../../ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../ui/alert-dialog";
import { AlertCircle, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getDAG,
  updateDAGSettings,
  type DAGDetailResponse,
  PipelinesApiError,
} from "../../../api/pipelinesApi";

interface EditDagTabProps {
  dagId: string;
}

interface Tag {
  name: string;
  enabled: boolean;
}

export function EditDagTab({ dagId }: EditDagTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dagData, setDagData] = useState<DAGDetailResponse | null>(null);
  
  // Form state
  const [schedule, setSchedule] = useState("0 17 * * *");
  const [timezone, setTimezone] = useState("Asia/Ho_Chi_Minh");
  const [catchupOff, setCatchupOff] = useState(true);
  const [maxActiveRuns, setMaxActiveRuns] = useState(1);
  const [retries, setRetries] = useState(2);
  const [retryDelay, setRetryDelay] = useState(5);
  const [owner, setOwner] = useState("data-eng");
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Original values for discard
  const [originalValues, setOriginalValues] = useState({
    schedule: "0 17 * * *",
    timezone: "Asia/Ho_Chi_Minh",
    catchupOff: true,
    maxActiveRuns: 1,
    retries: 2,
    retryDelay: 5,
    owner: "data-eng",
    tags: [] as Tag[],
  });
  
  const [newTagInput, setNewTagInput] = useState("");
  const [tagError, setTagError] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "save" | "discard" | null;
  }>({
    open: false,
    action: null,
  });

  // Fetch DAG details
  const fetchDagData = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getDAG(dagId, 'airflow');
      setDagData(data);
      
      // Populate form with fetched data
      const newSchedule = data.scheduleCron || "0 17 * * *";
      const newTimezone = data.timezone || "Asia/Ho_Chi_Minh";
      const newCatchupOff = !data.catchup;
      const newMaxActiveRuns = data.maxActiveRuns || 1;
      const newRetries = data.defaultRetries ?? 2;
      const newRetryDelay = data.defaultRetryDelayMinutes ?? 5;
      const newOwner = data.owner || "data-eng";
      const newTags = (data.tags || []).map(t => ({ name: t, enabled: true }));
      
      setSchedule(newSchedule);
      setTimezone(newTimezone);
      setCatchupOff(newCatchupOff);
      setMaxActiveRuns(newMaxActiveRuns);
      setRetries(newRetries);
      setRetryDelay(newRetryDelay);
      setOwner(newOwner);
      setTags(newTags);
      
      // Store original values for discard
      setOriginalValues({
        schedule: newSchedule,
        timezone: newTimezone,
        catchupOff: newCatchupOff,
        maxActiveRuns: newMaxActiveRuns,
        retries: newRetries,
        retryDelay: newRetryDelay,
        owner: newOwner,
        tags: newTags,
      });
    } catch (err) {
      console.error('Failed to fetch DAG data:', err);
      toast.error('Failed to load DAG settings');
    } finally {
      setIsLoading(false);
    }
  }, [dagId]);

  useEffect(() => {
    fetchDagData();
  }, [fetchDagData]);

  const toggleTag = (tagName: string) => {
    setTags(
      tags.map((tag) =>
        tag.name === tagName
          ? { ...tag, enabled: !tag.enabled }
          : tag,
      ),
    );
  };

  const validateTag = (value: string): boolean => {
    // Lowercase a-z, 0-9, hyphen, underscore, 1-24 chars
    const tagRegex = /^[a-z0-9_-]{1,24}$/;
    return tagRegex.test(value);
  };

  const addTag = () => {
    const trimmedTag = newTagInput.trim().toLowerCase();

    if (!trimmedTag) return;

    if (!validateTag(trimmedTag)) {
      setTagError(
        "Invalid tag format. Use a-z, 0-9, -, _ (1-24 chars).",
      );
      return;
    }

    if (tags.some((tag) => tag.name === trimmedTag)) {
      setTagError("Tag already exists.");
      return;
    }

    setTags([...tags, { name: trimmedTag, enabled: true }]);
    setNewTagInput("");
    setTagError("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSave = () => {
    setConfirmDialog({
      open: true,
      action: "save",
    });
  };

  const handleDiscard = () => {
    setConfirmDialog({
      open: true,
      action: "discard",
    });
  };

  const executeSave = async () => {
    setConfirmDialog({ open: false, action: null });
    
    try {
      setIsSaving(true);
      
      await updateDAGSettings(dagId, {
        scheduleCron: schedule,
        timezone: timezone,
        catchup: !catchupOff,
        maxActiveRuns: maxActiveRuns,
        defaultArgs: {
          retries: retries,
          retryDelayMinutes: retryDelay,
          owner: owner,
          tags: tags.filter(t => t.enabled).map(t => t.name),
        },
      });
      
      // Update original values after successful save
      setOriginalValues({
        schedule,
        timezone,
        catchupOff,
        maxActiveRuns,
        retries,
        retryDelay,
        owner,
        tags: [...tags],
      });
      
      toast.success("DAG settings saved successfully.");
    } catch (err) {
      if (err instanceof PipelinesApiError) {
        toast.error(err.message);
      } else {
        toast.error("Failed to save DAG settings.");
      }
      console.error('Failed to save DAG settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const executeDiscard = () => {
    // Reset to original values
    setSchedule(originalValues.schedule);
    setTimezone(originalValues.timezone);
    setCatchupOff(originalValues.catchupOff);
    setMaxActiveRuns(originalValues.maxActiveRuns);
    setRetries(originalValues.retries);
    setRetryDelay(originalValues.retryDelay);
    setOwner(originalValues.owner);
    setTags([...originalValues.tags]);
    setNewTagInput("");
    setTagError("");
    
    toast.success("Changes discarded.");
    setConfirmDialog({ open: false, action: null });
  };

  const executeAction = () => {
    if (confirmDialog.action === "save") {
      executeSave();
    } else if (confirmDialog.action === "discard") {
      executeDiscard();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-24" />
          </div>
        </Card>
        <Card className="p-4">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Form */}
      <Card className="p-4">
        <h3 className="mb-4">DAG Settings</h3>
        <div className="space-y-4">
          {/* Schedule */}
          <div>
            <Label htmlFor="schedule" className="mb-1.5 block">
              Schedule (CRON)
            </Label>
            <Input
              id="schedule"
              type="text"
              value={schedule}
              onChange={(e) => setSchedule(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: minute hour day month weekday
            </p>
          </div>

          {/* Timezone */}
          <div>
            <Label htmlFor="timezone" className="mb-1.5 block">
              Timezone
            </Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Asia/Ho_Chi_Minh">
                  Asia/Ho_Chi_Minh
                </SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
                <SelectItem value="Asia/Singapore">
                  Asia/Singapore
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Catchup */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="catchup" 
              checked={catchupOff}
              onCheckedChange={(checked) => setCatchupOff(checked === true)}
            />
            <label
              htmlFor="catchup"
              className="text-sm cursor-pointer"
            >
              Catchup off (skip missed runs)
            </label>
          </div>

          {/* Max active runs */}
          <div>
            <Label htmlFor="max-runs" className="mb-1.5 block">
              Max active runs
            </Label>
            <Input
              id="max-runs"
              type="number"
              min={0}
              value={maxActiveRuns}
              onChange={(e) => {
                const val = e.target.value;
                setMaxActiveRuns(val === '' ? 0 : Math.max(0, parseInt(val) || 0));
              }}
              className="w-24"
            />
          </div>
        </div>
      </Card>

      {/* Default Args */}
      <Card className="p-4">
        <h3 className="mb-4">Default Arguments</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="retries" className="mb-1.5 block">
                Retries
              </Label>
              <Input
                id="retries"
                type="number"
                min={0}
                value={retries}
                onChange={(e) => {
                  const val = e.target.value;
                  setRetries(val === '' ? 0 : Math.max(0, parseInt(val) || 0));
                }}
              />
            </div>
            <div>
              <Label
                htmlFor="retry-delay"
                className="mb-1.5 block"
              >
                Retry delay (min)
              </Label>
              <Input
                id="retry-delay"
                type="number"
                min={0}
                value={retryDelay}
                onChange={(e) => {
                  const val = e.target.value;
                  setRetryDelay(val === '' ? 0 : Math.max(0, parseInt(val) || 0));
                }}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="owner" className="mb-1.5 block">
              Owner
            </Label>
            <Input
              id="owner"
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-2 block">Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.name}
                  variant={tag.enabled ? "default" : "outline"}
                  className={`px-3 py-1.5 gap-1.5 cursor-pointer ${
                    tag.enabled
                      ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
                      : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => toggleTag(tag.name)}
                >
                  <span>{tag.name}</span>
                  {tag.enabled ? (
                    <X className="w-3 h-3" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Add tag..."
                value={newTagInput}
                onChange={(e) => {
                  setNewTagInput(e.target.value);
                  setTagError("");
                }}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addTag}
                className="cursor-pointer"
              >
                + Add
              </Button>
            </div>
            {tagError && (
              <p className="text-xs text-red-600 mt-1">
                {tagError}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button 
          onClick={handleSave} 
          className="cursor-pointer"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save changes'
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleDiscard}
          className="cursor-pointer"
          disabled={isSaving}
        >
          Discard
        </Button>
      </div>

      <p className="text-sm text-gray-500 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        Changes affect future runs only.
      </p>

      {/* Confirmation Dialog */}
      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ ...confirmDialog, open })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "save" &&
                "Save DAG settings?"}
              {confirmDialog.action === "discard" &&
                "Discard unsaved changes?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "save" &&
                "These changes affect future runs only."}
              {confirmDialog.action === "discard" &&
                "All edits will be lost."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              className={
                confirmDialog.action === "discard"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              {confirmDialog.action === "save" && "Yes, save"}
              {confirmDialog.action === "discard" &&
                "Discard changes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}