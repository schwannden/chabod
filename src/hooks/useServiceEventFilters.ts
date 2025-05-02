
import { useState } from "react";

export function useServiceEventFilters() {
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().setDate(1)) // First day of current month
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() + 2)) // 2 months from now
  );

  return {
    selectedGroup,
    setSelectedGroup,
    selectedService,
    setSelectedService,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  };
}
