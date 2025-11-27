import { ServiceScheduleCard, ServiceEventForCard } from "./ServiceScheduleCard";
import { ServiceScheduleUpdateData } from "./ServiceScheduleCardEdit";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ServiceScheduleListProps {
  schedules: ServiceEventForCard[];
  isLoading: boolean;
  onUpdate: (eventId: string, updates: ServiceScheduleUpdateData) => Promise<void>;
  onDelete: (eventId: string) => Promise<void>;
  onRefetch: () => Promise<void>;
  canManage: boolean;
}

export function ServiceScheduleList({
  schedules,
  isLoading,
  onUpdate,
  onDelete,
  onRefetch,
  canManage,
}: ServiceScheduleListProps) {
  const { t } = useTranslation("services");

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">{t("noSchedulesInRange")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
      {schedules.map((schedule) => (
        <ServiceScheduleCard
          key={schedule.id}
          event={schedule}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onRefetch={onRefetch}
          isEditable={canManage}
        />
      ))}
    </div>
  );
}
