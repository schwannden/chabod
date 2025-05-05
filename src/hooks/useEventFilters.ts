import { useState } from "react";

interface EventFiltersOptions {
  initialGroupValue?: string;
  initialSecondaryValue?: string;
  initialStartDate?: Date;
  initialEndDate?: Date;
}

export function useEventFilters({
  initialGroupValue = "all",
  initialSecondaryValue = "all",
  initialStartDate = new Date(new Date().setHours(0, 0, 0, 0)),
  initialEndDate,
}: EventFiltersOptions = {}) {
  const [selectedGroup, setSelectedGroup] = useState<string>(initialGroupValue);
  const [selectedSecondary, setSelectedSecondary] = useState<string>(initialSecondaryValue);
  const [startDate, setStartDate] = useState<Date | undefined>(initialStartDate);
  const [endDate, setEndDate] = useState<Date | undefined>(initialEndDate);

  const resetFilters = () => {
    setSelectedGroup(initialGroupValue);
    setSelectedSecondary(initialSecondaryValue);
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
  };

  return {
    selectedGroup,
    setSelectedGroup,
    selectedSecondary,
    setSelectedSecondary,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    resetFilters,
  };
}
