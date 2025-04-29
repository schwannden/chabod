
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
