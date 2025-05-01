
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

interface ServiceEventFilterBarProps {
  groups: Group[];
  services: { id: string; name: string }[];
  selectedGroup: string;
  setSelectedGroup: (value: string) => void;
  selectedService: string;
  setSelectedService: (value: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
}

export function ServiceEventFilterBar({
  groups,
  services,
  selectedGroup,
  setSelectedGroup,
  selectedService,
  setSelectedService,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: ServiceEventFilterBarProps) {
  return (
    <FilterLayout>
      <FilterGroup label="組別">
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="選擇組別" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有組別</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup label="服事類型">
        <Select value={selectedService} onValueChange={setSelectedService}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="選擇服事" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有服事</SelectItem>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup label="開始日期">
        <div className="relative">
          <Calendar
            className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <Input
            type="date"
            value={formatDateForInput(startDate)}
            onChange={(e) => setStartDate(parseDateFromInput(e.target.value))}
            className={cn(
              "w-full pl-8",
              !startDate && "text-muted-foreground"
            )}
          />
        </div>
      </FilterGroup>

      <FilterGroup label="結束日期">
        <div className="relative">
          <Calendar
            className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          />
          <Input
            type="date"
            value={formatDateForInput(endDate)}
            onChange={(e) => setEndDate(parseDateFromInput(e.target.value))}
            className={cn(
              "w-full pl-8",
              !endDate && "text-muted-foreground"
            )}
          />
        </div>
      </FilterGroup>
    </FilterLayout>
  );
}
