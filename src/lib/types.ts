
import { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Tenant = Database["public"]["Tables"]["tenants"]["Row"];
export type TenantMember = Database["public"]["Tables"]["tenant_members"]["Row"];
export type Invitation = Database["public"]["Tables"]["invitations"]["Row"];
export type Group = Database["public"]["Tables"]["groups"]["Row"];
export type GroupMember = Database["public"]["Tables"]["group_members"]["Row"];

export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventGroup = Database["public"]["Tables"]["events_groups"]["Row"];

export type EventWithGroups = Event & {
  groups?: string[];
};

export type TenantWithMemberCount = Tenant & {
  memberCount: number;
  groupCount?: number;
  eventCount?: number;
};

export type TenantMemberWithProfile = TenantMember & {
  profile: Profile;
};

export type GroupWithMemberCount = Group & {
  memberCount: number;
};

export type GroupMemberWithProfile = GroupMember & {
  profile: Profile;
};

export type PriceTier = Database["public"]["Tables"]["price_tiers"]["Row"];

export type TenantWithPriceTier = Tenant & {
  price_tier: PriceTier;
};

export type Resource = Database["public"]["Tables"]["resources"]["Row"];
export type ResourceGroup = Database['public']['Tables']['resources_groups']['Row'];

export type ResourceWithGroups = Resource & {
  groups?: string[];
};

export type Service = Database["public"]["Tables"]["services"]["Row"];
export type ServiceAdmin = Database["public"]["Tables"]["service_admins"]["Row"];
export type ServiceNote = Database["public"]["Tables"]["service_notes"]["Row"];
export type ServiceGroup = Database["public"]["Tables"]["service_groups"]["Row"];
export type ServiceRole = Database["public"]["Tables"]["service_roles"]["Row"];

export type ServiceEvent = Database["public"]["Tables"]["service_events"]["Row"];
export type ServiceEventOwner = Database["public"]["Tables"]["service_event_owners"]["Row"];

export type ServiceEventOwnerWithDetails = ServiceEventOwner & {
  profile: Profile;
  role: ServiceRole;
};

export type ServiceEventWithOwners = ServiceEvent & {
  owners: ServiceEventOwnerWithDetails[];
};

export type SessionContextType = {
  session: any | null;
  user: any | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

export type ServiceWithGroups = Service & {
  groups?: string[];
};
