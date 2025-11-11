import { useState } from "react";
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
import { AlertCircle, X, Check } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface EditDagTabProps {
  dagId: string;
}

interface Tag {
  name: string;
  enabled: boolean;
}

const initialTagsByDag: Record<string, Tag[]> = {
  vn30_data_crawler: [
    { name: "ingestion", enabled: true },
    { name: "vn30", enabled: true },
  ],
  vn30_model_training: [
    { name: "ml", enabled: true },
    { name: "vn30", enabled: true },
  ],
};

export function EditDagTab({ dagId }: EditDagTabProps) {
  const [tags, setTags] = useState<Tag[]>(
    initialTagsByDag[dagId] || [],
  );
  const [savedTags, setSavedTags] = useState<Tag[]>(
    initialTagsByDag[dagId] || [],
  );
  const [newTagInput, setNewTagInput] = useState("");
  const [tagError, setTagError] = useState("");
  const [schedule, setSchedule] = useState("0 17 * * *");
  const [savedSchedule, setSavedSchedule] =
    useState("0 17 * * *");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "save" | "discard" | null;
  }>({
    open: false,
    action: null,
  });

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

  const executeSave = () => {
    setSavedTags([...tags]);
    setSavedSchedule(schedule);
    toast.success("DAG settings saved.");
    setConfirmDialog({ open: false, action: null });
  };

  const executeDiscard = () => {
    setTags([...savedTags]);
    setSchedule(savedSchedule);
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
            <Select defaultValue="asia-hcm">
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asia-hcm">
                  Asia/Ho_Chi_Minh
                </SelectItem>
                <SelectItem value="utc">UTC</SelectItem>
                <SelectItem value="asia-singapore">
                  Asia/Singapore
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Catchup */}
          <div className="flex items-center space-x-2">
            <Checkbox id="catchup" defaultChecked />
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
              defaultValue="1"
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
                defaultValue="2"
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
                defaultValue="5"
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
              defaultValue="data-eng"
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
        <Button onClick={handleSave} className="cursor-pointer">
          Save changes
        </Button>
        <Button
          variant="outline"
          onClick={handleDiscard}
          className="cursor-pointer"
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