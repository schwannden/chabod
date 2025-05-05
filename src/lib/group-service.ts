import { supabase } from "@/integrations/supabase/client";
import { Group, GroupMember, GroupWithMemberCount, GroupMemberWithProfile } from "./types";

/**
 * Fetches all groups for a tenant
 */
export async function getTenantGroups(tenantId: string): Promise<GroupWithMemberCount[]> {
  const { data: groups, error } = await supabase
    .from("groups")
    .select("*")
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("Error fetching groups:", error);
    return [];
  }

  const groupsWithCounts = await Promise.all(
    groups.map(async (group) => {
      const { count, error: countError } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", group.id);

      if (countError) {
        console.error("Error counting members:", countError);
        return { ...group, memberCount: 0 };
      }

      return { ...group, memberCount: count || 0 };
    }),
  );

  return groupsWithCounts;
}

/**
 * Creates a new group
 */
export async function createGroup(
  tenantId: string,
  name: string,
  description?: string,
): Promise<Group | null> {
  const { data, error } = await supabase
    .from("groups")
    .insert({
      tenant_id: tenantId,
      name,
      description,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating group:", error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Updates an existing group
 */
export async function updateGroup(
  groupId: string,
  name: string,
  description?: string,
): Promise<Group | null> {
  const { data, error } = await supabase
    .from("groups")
    .update({
      name,
      description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", groupId)
    .select()
    .single();

  if (error) {
    console.error("Error updating group:", error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Deletes a group
 */
export async function deleteGroup(groupId: string): Promise<void> {
  const { error } = await supabase.from("groups").delete().eq("id", groupId);

  if (error) {
    console.error("Error deleting group:", error);
    throw new Error(error.message);
  }
}

/**
 * Fetches all members of a group with their profile information
 */
export async function getGroupMembers(groupId: string): Promise<GroupMemberWithProfile[]> {
  const { data: members, error: memberError } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId);

  if (memberError) {
    console.error("Error fetching group members:", memberError);
    return [];
  }

  if (!members || members.length === 0) {
    return [];
  }

  const userIds = members.map((member) => member.user_id);
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds);

  if (profileError) {
    console.error("Error fetching profiles:", profileError);
    return [];
  }

  const membersWithProfiles = members.map((member) => {
    const profile = profiles?.find((p) => p.id === member.user_id) || null;
    return {
      ...member,
      profile: profile,
    } as GroupMemberWithProfile;
  });

  return membersWithProfiles;
}

/**
 * Adds a user to a group
 */
export async function addUserToGroup(groupId: string, userId: string): Promise<GroupMember | null> {
  const { data, error } = await supabase
    .from("group_members")
    .insert({
      group_id: groupId,
      user_id: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding user to group:", error);
    throw new Error(error.message);
  }

  return data;
}

/**
 * Removes a user from a group
 */
export async function removeUserFromGroup(groupMemberId: string): Promise<void> {
  const { error } = await supabase.from("group_members").delete().eq("id", groupMemberId);

  if (error) {
    console.error("Error removing user from group:", error);
    throw new Error(error.message);
  }
}

/**
 * Checks if a user is a member of a group
 */
export async function isUserInGroup(groupId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking group membership:", error);
    return false;
  }

  return !!data;
}
