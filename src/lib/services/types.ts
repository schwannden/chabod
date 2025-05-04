export * from '../types';

// Define the ServiceNote type that matches the database schema
export interface ServiceNote {
  id: string;
  service_id: string;
  tenant_id: string;
  text: string;
  link?: string;
  created_at: string;
  updated_at: string;
}

// Define the ServiceRole type that matches the database schema
export interface ServiceRole {
  id: string;
  service_id: string;
  tenant_id: string;
  name: string;
  description?: string;  // Added description field
  created_at: string;
  updated_at: string;
}

// Define the ServiceGroup type that matches the database schema
export interface ServiceGroup {
  id: string;
  service_id: string;
  group_id: string;
  created_at: string;
  updated_at: string;
}

// Define the ServiceEvent type that matches the database schema
export interface ServiceEvent {
  id: string;
  service_id: string;
  tenant_id: string;
  date: string;
  start_time: string;
  end_time: string;
  subtitle?: string;
  created_at: string;
  updated_at: string;
}

// Define the ServiceEventOwner type that matches the database schema
export interface ServiceEventOwner {
  id: string;
  service_event_id: string;
  user_id: string;
  service_role_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

// Define a common UserProfile type
export interface UserProfile {
  id?: string; // Optional, might not always be present depending on join
  email: string | null;
  full_name: string | null;
}

export interface ServiceEventOwnerWithDetails extends ServiceEventOwner {
  profile: UserProfile | null; // Profile information, allow null if join might fail
  role: ServiceRole; // Role information
}

export interface ServiceEventWithOwners extends ServiceEvent {
  owners: ServiceEventOwnerWithDetails[];
}

export interface ServiceEventWithService extends ServiceEvent {
  service: {
    id: string;
    name: string;
  };
}

// Interface to define the structure of an owner when adding to an event
export interface ServiceEventOwnerFormValue {
  userId: string;
  roleId: string;
  profile: UserProfile | null; // Use UserProfile, allow null
  role: ServiceRole;
}
