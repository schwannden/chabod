import { FilterLayout } from "@/components/Layout/FilterLayout";
import { FilterGroup } from "@/components/Layout/FilterGroup";
import { Group } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateForInput, parseDateFromInput } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

interface EventFilterBarProps {
  groups: Group[];
  selectedGroup: string;
  setSelectedGroup: (value: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
}

export function EventFilterBar({
  groups,
  selectedGroup,
  setSelectedGroup,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: EventFilterBarProps) {
  return (
    <FilterLayout>
      <FilterGroup label="Group">
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger>
            <SelectValue placeholder="Select Group" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Groups</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup label="From">
        <div className="relative">
          <Calendar
            className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <Input
            type="date"
            value={formatDateForInput(startDate)}
            onChange={(e) => setStartDate(parseDateFromInput(e.target.value))}
            className={cn(
              "w-full sm:w-auto pl-8",
              !startDate && "text-muted-foreground"
            )}
          />
        </div>
      </FilterGroup>

      <FilterGroup label="To">
        <div className="relative">
          <Calendar
            className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <Input
            type="date"
            value={formatDateForInput(endDate)}
            onChange={(e) => setEndDate(parseDateFromInput(e.target.value))}
            className={cn(
              "w-full sm:w-auto pl-8",
              !endDate && "text-muted-foreground"
            )}
          />
        </div>
      </FilterGroup>
    </FilterLayout>
  );
}
