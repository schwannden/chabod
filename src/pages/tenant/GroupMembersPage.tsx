import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { NavBar } from "@/components/Layout/NavBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tenant, Profile, GroupMemberWithProfile } from "@/lib/types";
import { getTenantBySlug, getTenantMembers } from "@/lib/tenant-utils";
import { addUserToGroup, getGroupMembers, removeUserFromGroup } from "@/lib/group-service";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserMinus } from "lucide-react";
import { TenantBreadcrumb } from "@/components/Layout/TenantBreadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function GroupMembersPage() {
  const { slug, groupId } = useParams<{ slug: string; groupId: string }>();
  const { user, isLoading: isSessionLoading } = useSession();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [groupName, setGroupName] = useState<string>("");
  const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTenantOwner, setIsTenantOwner] = useState(false);

  useEffect(() => {
    if (!isSessionLoading && !user) {
      navigate(`/tenant/${slug}/auth`);
    }
  }, [user, isSessionLoading, navigate, slug]);

  useEffect(() => {
    const fetchDataAndCheckAccess = async () => {
      if (!slug || !user || !groupId) return;
      
      try {
        const tenantData = await getTenantBySlug(slug);
        if (!tenantData) {
          navigate("/not-found");
          return;
        }
        setTenant(tenantData);
        
        setIsTenantOwner(tenantData.owner_id === user.id);
        
        const { data: groupData, error: groupError } = await supabase
          .from("groups")
          .select("*")
          .eq("id", groupId)
          .single();
          
        if (groupError || !groupData) {
          console.error("Error fetching group:", groupError);
          navigate(`/tenant/${slug}`);
          return;
        }
        
        setGroupName(groupData.name);
        
        const groupMembers = await getGroupMembers(groupId);
        setMembers(groupMembers);
        
        const tenantMembers = await getTenantMembers(tenantData.id);
        const existingMemberIds = new Set(groupMembers.map(m => m.user_id));
        
        const availableProfiles = tenantMembers
          .filter(tm => !existingMemberIds.has(tm.profile.id))
          .map(tm => tm.profile);
          
        setAvailableMembers(availableProfiles);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load group members",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDataAndCheckAccess();
    }
  }, [slug, groupId, user, navigate, toast]);

  const handleAddMember = async () => {
    if (!selectedUserId || !groupId) return;
    
    setIsSubmitting(true);
    try {
      await addUserToGroup(groupId, selectedUserId);
      toast({
        title: "Success",
        description: "Member added to group",
      });
      
      const updatedMembers = await getGroupMembers(groupId);
      setMembers(updatedMembers);
      
      const existingMemberIds = new Set(updatedMembers.map(m => m.user_id));
      setAvailableMembers(prev => 
        prev.filter(profile => !existingMemberIds.has(profile.id))
      );
      
      setIsAddMemberOpen(false);
      setSelectedUserId("");
    } catch (error) {
      console.error("Failed to add member:", error);
      toast({
        title: "Error",
        description: "Failed to add member to group",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setIsSubmitting(true);
    try {
      await removeUserFromGroup(memberId);
      toast({
        title: "Success",
        description: "Member removed from group",
      });
      
      const updatedMembers = await getGroupMembers(groupId!);
      setMembers(updatedMembers);
      
      if (tenant) {
        const tenantMembers = await getTenantMembers(tenant.id);
        const existingMemberIds = new Set(updatedMembers.map(m => m.user_id));
        const availableProfiles = tenantMembers
          .filter(tm => !existingMemberIds.has(tm.profile.id))
          .map(tm => tm.profile);
        setAvailableMembers(availableProfiles);
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
      toast({
        title: "Error",
        description: "Failed to remove member from group",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSessionLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <NavBar tenant={tenant ? { 
        name: tenant.name, 
        slug: tenant.slug,
        id: tenant.id
      } : undefined} />
      <main className="flex-1 container mx-auto px-4 py-8">
        {tenant && (
          <div className="mb-6 space-y-6">
            <TenantBreadcrumb
              tenantName={tenant.name}
              tenantSlug={tenant.slug}
              items={[
                { 
                  label: "Groups", 
                  path: `/tenant/${tenant.slug}/groups` 
                },
                { 
                  label: "Members" 
                }
              ]}
            />

            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">{groupName} Members</h1>
                <p className="text-muted-foreground">
                  Manage members for this group
                </p>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate(`/tenant/${slug}/groups`)}
                >
                  Back to Groups
                </Button>
                
                {isTenantOwner && (
                  <Button 
                    onClick={() => setIsAddMemberOpen(true)}
                    disabled={availableMembers.length === 0}
                  >
                    Add Member
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {members.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No members in this group yet. {isTenantOwner && availableMembers.length > 0 && "Add members to get started."}
            {isTenantOwner && availableMembers.length === 0 && "All tenant members are already in this group."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Added On</TableHead>
                {isTenantOwner && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.profile?.full_name || "Unknown"}
                  </TableCell>
                  <TableCell>{member.profile?.email || "No email"}</TableCell>
                  <TableCell>{new Date(member.created_at).toLocaleDateString()}</TableCell>
                  {isTenantOwner && (
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={isSubmitting}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Member to Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {availableMembers.length === 0 ? (
                <p>All tenant members are already in this group.</p>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="member-select">Select Member</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger id="member-select">
                      <SelectValue placeholder="Select a member" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableMembers.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name} ({profile.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddMember} 
                disabled={isSubmitting || !selectedUserId || availableMembers.length === 0}
              >
                {isSubmitting ? "Adding..." : "Add to Group"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
