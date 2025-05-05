
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TenantMemberWithProfile } from "@/lib/types";

interface ServiceAdminsFormProps {
  members: TenantMemberWithProfile[];
  selectedAdmins: string[];
  setSelectedAdmins: (admins: string[]) => void;
}

export function ServiceAdminsForm({
  members,
  selectedAdmins,
  setSelectedAdmins,
}: ServiceAdminsFormProps) {
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
                    if (checked) {
                      setSelectedAdmins([...selectedAdmins, member.user_id]);
                    } else {
                      setSelectedAdmins(
                        selectedAdmins.filter((id) => id !== member.user_id)
                      );
                    }
                  }}
                />
                <label
                  htmlFor={`admin-${member.user_id}`}
                  className="text-sm font-medium"
                >
                  {member.profile?.full_name ||
                    member.profile?.email ||
                    "匿名成員"}
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
