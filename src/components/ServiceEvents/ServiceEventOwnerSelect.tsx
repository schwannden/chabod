import { useState, useEffect } from "react";
import { Check, Plus, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { TenantMemberWithProfile } from "@/lib/types";
import { ServiceRole, UserProfile } from "@/lib/services/types";

export interface ServiceEventOwner {
  userId: string;
  roleId: string;
  profile: UserProfile | null;
  role: ServiceRole;
}

interface ServiceEventOwnerSelectProps {
  serviceId: string;
  tenantId: string;
  selectedOwners: ServiceEventOwner[];
  setSelectedOwners: (owners: ServiceEventOwner[]) => void;
}

export function ServiceEventOwnerSelect({
  serviceId,
  tenantId,
  selectedOwners,
  setSelectedOwners
}: ServiceEventOwnerSelectProps) {
  const [members, setMembers] = useState<TenantMemberWithProfile[]>([]);
  const [roles, setRoles] = useState<ServiceRole[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch tenant members
        const { data: membersData, error: membersError } = await supabase
          .from("tenant_members")
          .select(`
            *,
            profile:profiles(*)
          `)
          .eq("tenant_id", tenantId);

        if (membersError) throw membersError;
        
        // Fetch service roles
        const { data: rolesData, error: rolesError } = await supabase
          .from("service_roles")
          .select("*")
          .eq("service_id", serviceId)
          .order("name");

        if (rolesError) throw rolesError;

        setMembers(membersData as TenantMemberWithProfile[] || []);
        setRoles(rolesData as ServiceRole[] || []);

        // Set default selections if available
        if (rolesData?.length > 0 && membersData?.length > 0) {
          setSelectedRoleId(rolesData[0].id);
          setSelectedUserId(membersData[0].user_id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (serviceId && tenantId) {
      fetchData();
    }
  }, [serviceId, tenantId]);

  const handleAddOwner = () => {
    if (!selectedUserId || !selectedRoleId) return;

    // Check if this user+role combination already exists
    const exists = selectedOwners.some(
      owner => owner.userId === selectedUserId && owner.roleId === selectedRoleId
    );

    if (exists) return;

    const selectedMember = members.find(m => m.user_id === selectedUserId);
    const selectedRole = roles.find(r => r.id === selectedRoleId);

    if (selectedMember && selectedRole) {
      const newOwner: ServiceEventOwner = {
        userId: selectedUserId,
        roleId: selectedRoleId,
        profile: selectedMember.profile,
        role: selectedRole
      };

      setSelectedOwners([...selectedOwners, newOwner]);
    }
  };

  const handleRemoveOwner = (userId: string, roleId: string) => {
    setSelectedOwners(
      selectedOwners.filter(
        owner => !(owner.userId === userId && owner.roleId === roleId)
      )
    );
  };

  if (isLoading) {
    return <div className="text-center py-4">正在載入...</div>;
  }

  if (roles.length === 0) {
    return (
      <div className="text-center py-4 text-yellow-600">
        此服事類型尚未設定任何角色，請先在服事類型頁面設定角色。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">成員</label>
          <Select
            value={selectedUserId}
            onValueChange={setSelectedUserId}
            disabled={members.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="選擇成員" />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  {member.profile?.full_name || member.profile?.email || "未命名成員"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <label className="text-sm font-medium mb-1 block">角色</label>
          <Select
            value={selectedRoleId}
            onValueChange={setSelectedRoleId}
            disabled={roles.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="選擇角色" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button 
          onClick={handleAddOwner} 
          type="button" 
          variant="outline" 
          size="icon"
          disabled={!selectedUserId || !selectedRoleId}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {selectedOwners.length > 0 && (
        <>
          <Separator />
          <div className="text-sm font-medium">已選擇的成員</div>
          <ScrollArea className="h-[150px] rounded-md border">
            <div className="p-2">
              {selectedOwners.map((owner) => (
                <div 
                  key={`${owner.userId}-${owner.roleId}`} 
                  className="flex items-center justify-between py-2 px-1"
                >
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-1 rounded-full">
                      <UserRound className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {owner.profile?.full_name || owner.profile?.email || "未命名成員"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {owner.role.name}
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleRemoveOwner(owner.userId, owner.roleId)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}
