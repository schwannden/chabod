import { Group } from "@/lib/types";
import { GenericFilterBar, FilterConfig } from "@/components/shared/GenericFilterBar";
import { useTranslation } from "react-i18next";

interface EventFilterBarProps {
  allGroups: Group[];
  selectedGroup: string;
  setSelectedGroup: (value: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  endDate: Date | undefined;
  setEndDate: (date: Date | undefined) => void;
}

export function EventFilterBar({
  allGroups,
  selectedGroup,
  setSelectedGroup,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: EventFilterBarProps) {
  const { t } = useTranslation();

  // Create a configuration array for our filters
  const filters: FilterConfig<Group>[] = [
    // Group filter
    {
      type: "select",
      id: "group-filter",
      label: t("events:filterGroup"),
      placeholder: t("events:selectGroup"),
      options: allGroups,
      value: selectedGroup,
      onChange: setSelectedGroup,
    },
    // Start date filter
    {
      type: "date",
      id: "start-date-filter",
      label: t("events:filterFrom"),
      value: startDate,
      onChange: setStartDate,
    },
    // End date filter
    {
      type: "date",
      id: "end-date-filter",
      label: t("events:filterTo"),
      value: endDate,
      onChange: setEndDate,
    },
  ];

  return <GenericFilterBar filters={filters} />;
}
