import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TenantMemberWithProfile } from "@/lib/types";
import { toast } from "sonner";
import { addServiceAdmin, removeServiceAdmin } from "@/lib/services";

interface ServiceAdminsFormProps {
  members: TenantMemberWithProfile[];
  selectedAdmins: string[];
  setSelectedAdmins: (admins: string[]) => void;
  serviceId?: string;
  isEditing: boolean;
}

export function ServiceAdminsForm({
  members,
  selectedAdmins,
  setSelectedAdmins,
  serviceId,
  isEditing,
}: ServiceAdminsFormProps) {
  // For new services (not editing), we just manage local state
  // For existing services, we update in real-time

  const handleAdminChange = async (adminId: string, checked: boolean) => {
    try {
      if (isEditing && serviceId) {
        // Update database in real-time
        if (checked) {
          await addServiceAdmin(serviceId, adminId);
        } else {
          await removeServiceAdmin(serviceId, adminId);
        }
      }

      // Always update local state
      if (checked) {
        setSelectedAdmins([...selectedAdmins, adminId]);
      } else {
        setSelectedAdmins(selectedAdmins.filter((id) => id !== adminId));
      }
    } catch (error) {
      console.error("Error updating service admins:", error);
      toast.error("更新管理員時發生錯誤");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">選擇服事管理員</h3>
      <ScrollArea className="h-72 border rounded-md p-2">
        <div className="space-y-2">
          {members.length > 0 ? (
            members.map((member) => (
              <div key={member.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`admin-${member.user_id}`}
                  checked={selectedAdmins.includes(member.user_id)}
                  onCheckedChange={(checked) => {
                    handleAdminChange(member.user_id, !!checked);
                  }}
                />
                <label htmlFor={`admin-${member.user_id}`} className="text-sm font-medium">
                  {member.profile?.full_name || member.profile?.email || "匿名成員"}
                </label>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">尚未有成員</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
