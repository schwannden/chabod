import { useState, useEffect } from "react";
import { X, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/components/ui/use-toast";

// Data structures for the new "all roles displayed" pattern
export interface AssignedMember {
  userId: string;
  profile: UserProfile | null;
}

export interface RoleAssignment {
  roleId: string;
  role: ServiceRole;
  assignedMembers: AssignedMember[];
}

interface ServiceEventRoleAssignmentListProps {
  serviceId: string;
  tenantId: string;
  roleAssignments: RoleAssignment[];
  setRoleAssignments: (assignments: RoleAssignment[]) => void;
}

export function ServiceEventRoleAssignmentList({
  serviceId,
  tenantId,
  roleAssignments,
  setRoleAssignments,
}: ServiceEventRoleAssignmentListProps) {
  const { t } = useTranslation("services");
  const { toast } = useToast();
  const [availableMembers, setAvailableMembers] = useState<TenantMemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // STEP 1: Fetch service roles and tenant members on mount
  useEffect(() => {
    async function initialize() {
      setIsLoading(true);
      try {
        // Fetch all roles for this service (CRITICAL: order by name)
        const { data: rolesData, error: rolesError } = await supabase
          .from("service_roles")
          .select("*")
          .eq("service_id", serviceId)
          .order("name");

        if (rolesError) throw rolesError;

        // Fetch all tenant members (for dropdown options)
        const { data: membersData, error: membersError } = await supabase
          .from("tenant_members")
          .select(
            `
            *,
            profile:profiles(*)
          `,
          )
          .eq("tenant_id", tenantId);

        if (membersError) throw membersError;

        setAvailableMembers((membersData as TenantMemberWithProfile[]) || []);

        // STEP 2: Initialize roleAssignments if empty (for create/copy dialogs)
        // Use functional update to get current state and avoid dependency issues
        setRoleAssignments((currentAssignments) => {
          if (currentAssignments.length === 0 && rolesData && rolesData.length > 0) {
            const initialAssignments: RoleAssignment[] = rolesData.map((role) => ({
              roleId: role.id,
              role: role as ServiceRole,
              assignedMembers: [], // Empty initially
            }));
            return initialAssignments;
          }
          return currentAssignments;
        });
      } catch (error) {
        console.error("Failed to load roles/members:", error);
        toast({
          title: t("error"),
          description: t("loadingError"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    if (serviceId && tenantId) {
      initialize();
    }
  }, [serviceId, tenantId, toast, t, setRoleAssignments]);

  // STEP 3: Handle assigning member to role
  const handleAssignMember = (roleId: string, userId: string) => {
    if (!userId) return;

    const member = availableMembers.find((m) => m.user_id === userId);
    if (!member) return;

    const updatedAssignments = roleAssignments.map((assignment) => {
      if (assignment.roleId === roleId) {
        // CHECK: Is this member already assigned to this role?
        const alreadyAssigned = assignment.assignedMembers.some((m) => m.userId === userId);
        if (alreadyAssigned) {
          // TOAST: "Member already assigned to this role"
          toast({
            title: t("memberAlreadyAssigned"),
            description: t("memberRoleAlreadyExists"),
            variant: "destructive",
          });
          return assignment;
        }

        // ADD member to this role
        return {
          ...assignment,
          assignedMembers: [...assignment.assignedMembers, { userId, profile: member.profile }],
        };
      }
      return assignment;
    });

    setRoleAssignments(updatedAssignments);
  };

  // STEP 4: Handle unassigning member from role
  const handleUnassignMember = (roleId: string, userId: string) => {
    const updatedAssignments = roleAssignments.map((assignment) => {
      if (assignment.roleId === roleId) {
        return {
          ...assignment,
          assignedMembers: assignment.assignedMembers.filter((m) => m.userId !== userId),
        };
      }
      return assignment;
    });

    setRoleAssignments(updatedAssignments);
  };

  // Loading state
  if (isLoading) {
    return <div className="text-center py-4">{t("loading")}</div>;
  }

  // Empty state - no roles configured
  if (roleAssignments.length === 0) {
    return <div className="text-center py-4 text-yellow-600">{t("noRolesConfigured")}</div>;
  }

  // RENDER: Each role with its assigned members
  return (
    <div className="space-y-3">
      {roleAssignments.map((assignment) => (
        <div key={assignment.roleId} className="border rounded-md p-3 space-y-2">
          {/* Role name header */}
          <div className="font-medium text-sm">{assignment.role.name}</div>

          {/* List of assigned members with X button */}
          {assignment.assignedMembers.length > 0 && (
            <div className="space-y-1">
              {assignment.assignedMembers.map((member) => (
                <div
                  key={member.userId}
                  className="flex items-center gap-2 p-2 bg-accent/50 rounded-sm"
                >
                  <div className="bg-primary/10 p-1 rounded-full shrink-0">
                    <UserRound className="h-3 w-3 text-primary" />
                  </div>
                  <span className="flex-1 text-sm truncate">
                    {member.profile?.full_name || member.profile?.email || t("unnamedMember")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => handleUnassignMember(assignment.roleId, member.userId)}
                    type="button"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Member selector dropdown */}
          <Select
            value=""
            onValueChange={(userId) => {
              handleAssignMember(assignment.roleId, userId);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("selectMemberForRole")} />
            </SelectTrigger>
            <SelectContent>
              {availableMembers.length === 0 ? (
                <SelectItem value="no-members" disabled>
                  {t("noMembersYet")}
                </SelectItem>
              ) : (
                availableMembers.map((member) => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.profile?.full_name || member.profile?.email || t("unnamedMember")}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
