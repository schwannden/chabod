import { Group } from "@/lib/types";
import { GenericFilterBar, BaseFilterOption, FilterConfig } from "@/components/shared/GenericFilterBar";

// Define a service type for the filter
interface Service extends BaseFilterOption {
  id: string;
  name: string;
  default_start_time?: string | null;
  default_end_time?: string | null;
  tenant_id: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface ServiceEventFilterBarProps {
  groups: Group[];
  services: Service[];
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
  // Create a configuration array for our filters
  const filters: FilterConfig<Group | Service>[] = [
    // Group filter
    {
      type: 'select',
      id: 'group-filter',
      label: '組別',
      placeholder: '選擇組別',
      options: groups,
      value: selectedGroup,
      onChange: setSelectedGroup,
    },
    // Service filter
    {
      type: 'select',
      id: 'service-filter',
      label: '服事類型',
      placeholder: '選擇服事',
      options: services,
      value: selectedService,
      onChange: setSelectedService,
    },
    // Start date filter
    {
      type: 'date',
      id: 'start-date-filter',
      label: '開始日期',
      value: startDate,
      onChange: setStartDate,
    },
    // End date filter
    {
      type: 'date',
      id: 'end-date-filter',
      label: '結束日期',
      value: endDate,
      onChange: setEndDate,
    },
  ];

  return <GenericFilterBar filters={filters} />;
}
