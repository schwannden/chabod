import { Group } from "@/lib/types";
import { GenericFilterBar, FilterConfig } from "@/components/shared/GenericFilterBar";

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
  // Create a configuration array for our filters
  const filters: FilterConfig<Group>[] = [
    // Group filter
    {
      type: 'select',
      id: 'group-filter',
      label: 'Group',
      placeholder: 'Select Group',
      options: groups,
      value: selectedGroup,
      onChange: setSelectedGroup,
    },
    // Start date filter
    {
      type: 'date',
      id: 'start-date-filter',
      label: 'From',
      value: startDate,
      onChange: setStartDate,
    },
    // End date filter
    {
      type: 'date',
      id: 'end-date-filter',
      label: 'To',
      value: endDate,
      onChange: setEndDate,
    },
  ];

  return <GenericFilterBar filters={filters} />;
}
