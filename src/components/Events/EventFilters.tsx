import { Group } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { getDateLocale } from "@/lib/dateUtils";

interface EventFiltersProps {
  groups: Group[];
  selectedGroup: string;
  setSelectedGroup: (value: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
}

export function EventFilters({
  groups,
  selectedGroup,
  setSelectedGroup,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: EventFiltersProps) {
  const { t } = useTranslation();
  const safeGroups = Array.isArray(groups) ? groups : [];

  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">{t("events:filterGroup")}</label>
        <Select value={selectedGroup} onValueChange={setSelectedGroup}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t("events:selectGroup")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("events:allGroups")}</SelectItem>
            {safeGroups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">{t("events:filterFrom")}</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Calendar className="mr-2 h-4 w-4" />
                {startDate
                  ? format(startDate, "PPP", { locale: getDateLocale() })
                  : t("events:startDate")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">{t("events:filterTo")}</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <Calendar className="mr-2 h-4 w-4" />
                {endDate
                  ? format(endDate, "PPP", { locale: getDateLocale() })
                  : t("events:endDate")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
