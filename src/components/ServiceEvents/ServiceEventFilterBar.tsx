import { Group, Service } from "@/lib/types";
import { GenericFilterBar, FilterConfig } from "@/components/shared/GenericFilterBar";
import { useTranslation } from "react-i18next";

interface ServiceEventFilterBarProps {
  allGroups: Group[];
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
  allGroups,
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
  const { t } = useTranslation("services");

  // Create a configuration array for our filters
  const filters: FilterConfig<Group | Service>[] = [
    // Group filter
    {
      type: "select",
      id: "group-filter",
      label: t("group"),
      placeholder: t("selectGroup"),
      options: allGroups,
      value: selectedGroup,
      onChange: setSelectedGroup,
    },
    // Service filter
    {
      type: "select",
      id: "service-filter",
      label: t("serviceType"),
      placeholder: t("selectService"),
      options: services,
      value: selectedService,
      onChange: setSelectedService,
    },
    // Start date filter
    {
      type: "date",
      id: "start-date-filter",
      label: t("startDate"),
      value: startDate,
      onChange: setStartDate,
    },
    // End date filter
    {
      type: "date",
      id: "end-date-filter",
      label: t("endDate"),
      value: endDate,
      onChange: setEndDate,
    },
  ];

  return <GenericFilterBar filters={filters} />;
}
