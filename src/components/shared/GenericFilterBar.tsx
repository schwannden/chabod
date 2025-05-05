import { FilterLayout } from "@/components/Layout/FilterLayout";
import { FilterGroup } from "@/components/Layout/FilterGroup";
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

// Base filter option interface
export interface BaseFilterOption {
  id: string;
  name: string;
}

// Filter configuration types
export type FilterType = "select" | "date";

// Configuration for a select filter
export interface SelectFilterConfig<T extends BaseFilterOption> {
  type: "select";
  id: string;
  label: string;
  placeholder?: string;
  options: T[];
  value: string;
  onChange: (value: string) => void;
}

// Configuration for a date filter
export interface DateFilterConfig {
  type: "date";
  id: string;
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
}

// Union type for all filter configurations
export type FilterConfig<T extends BaseFilterOption> = SelectFilterConfig<T> | DateFilterConfig;

// GenericFilterBar props
interface GenericFilterBarProps<T extends BaseFilterOption> {
  filters: FilterConfig<T>[];
}

export function GenericFilterBar<T extends BaseFilterOption>({
  filters,
}: GenericFilterBarProps<T>) {
  return (
    <FilterLayout>
      {filters.map((filter) => (
        <FilterGroup key={filter.id} label={filter.label}>
          {filter.type === "select" && (
            <Select value={filter.value} onValueChange={filter.onChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={filter.placeholder || "Select"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filter.label}</SelectItem>
                {filter.options.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filter.type === "date" && (
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={formatDateForInput(filter.value)}
                onChange={(e) => filter.onChange(parseDateFromInput(e.target.value))}
                className={cn("w-full pl-8", !filter.value && "text-muted-foreground")}
              />
            </div>
          )}
        </FilterGroup>
      ))}
    </FilterLayout>
  );
}
