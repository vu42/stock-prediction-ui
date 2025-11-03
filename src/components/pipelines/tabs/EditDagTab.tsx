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
import { AlertCircle, X } from "lucide-react";

interface EditDagTabProps {
  dagId: string;
}

export function EditDagTab({ dagId }: EditDagTabProps) {
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
              defaultValue="0 17 * * *"
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
              <Badge
                variant="secondary"
                className="px-3 py-1.5 gap-1.5"
              >
                ingestion
                <X className="w-3 h-3 cursor-pointer hover:text-gray-900" />
              </Badge>
              <Badge
                variant="secondary"
                className="px-3 py-1.5 gap-1.5"
              >
                vn30
                <X className="w-3 h-3 cursor-pointer hover:text-gray-900" />
              </Badge>
            </div>
            <Input type="text" placeholder="Add tag..." />
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button>Save changes</Button>
        <Button variant="outline">Discard</Button>
      </div>

      <p className="text-sm text-gray-500 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        Changes affect future runs only.
      </p>
    </div>
  );
}