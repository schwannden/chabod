import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Group } from "@/lib/types";
import { toast } from "sonner";
import { addServiceGroup, removeServiceGroup } from "@/lib/services";
import { useTranslation } from "react-i18next";

interface ServiceGroupsFormProps {
  groups: Group[];
  selectedGroups: string[];
  setSelectedGroups: (groups: string[]) => void;
  serviceId?: string;
  isEditing: boolean;
}

export function ServiceGroupsForm({
  groups,
  selectedGroups,
  setSelectedGroups,
  serviceId,
  isEditing,
}: ServiceGroupsFormProps) {
  const { t } = useTranslation("services");

  const handleGroupChange = async (groupId: string, checked: boolean) => {
    try {
      if (isEditing && serviceId) {
        // Update database in real-time
        if (checked) {
          await addServiceGroup(serviceId, groupId);
        } else {
          await removeServiceGroup(serviceId, groupId);
        }
      }

      // Always update local state
      if (checked) {
        setSelectedGroups([...selectedGroups, groupId]);
      } else {
        setSelectedGroups(selectedGroups.filter((id) => id !== groupId));
      }
    } catch (error) {
      console.error("Error updating service groups:", error);
      toast.error(t("errorUpdatingGroups"));
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t("selectServiceGroups")}</h3>
      <ScrollArea className="h-72 border rounded-md p-2">
        <div className="space-y-2">
          {groups.length > 0 ? (
            groups.map((group) => (
              <div key={group.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`group-${group.id}`}
                  checked={selectedGroups.includes(group.id)}
                  onCheckedChange={(checked) => {
                    handleGroupChange(group.id, !!checked);
                  }}
                />
                <label htmlFor={`group-${group.id}`} className="text-sm font-medium">
                  {group.name}
                </label>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">{t("noGroupsYet")}</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
