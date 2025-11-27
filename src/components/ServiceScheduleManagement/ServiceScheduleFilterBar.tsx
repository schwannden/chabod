import { Service } from "@/lib/types";
import { GenericFilterBar, FilterConfig } from "@/components/shared/GenericFilterBar";
import { useTranslation } from "react-i18next";

interface ServiceScheduleFilterBarProps {
  services: Service[];
  selectedServiceId: string;
  setSelectedServiceId: (value: string) => void;
}

export function ServiceScheduleFilterBar({
  services,
  selectedServiceId,
  setSelectedServiceId,
}: ServiceScheduleFilterBarProps) {
  const { t } = useTranslation("services");

  // Use GenericFilterBar with only service filter (no date filters)
  const filters: FilterConfig<Service>[] = [
    {
      type: "select",
      id: "service-filter",
      label: t("serviceType"),
      placeholder: t("selectService"),
      options: services,
      value: selectedServiceId,
      onChange: setSelectedServiceId,
    },
  ];

  return <GenericFilterBar filters={filters} />;
}
