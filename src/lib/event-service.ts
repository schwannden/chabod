import { supabase } from "@/integrations/supabase/client";
import { EventWithGroups } from "@/lib/types";

/**
 * Get events for a specific tenant with their associated groups
 */
export async function getTenantEvents(
  tenantId: string,
  selectedGroup?: string,
  startDate?: string,
  endDate?: string,
): Promise<EventWithGroups[]> {
  try {
    // Build a query that joins events with events_groups and groups
    // Filter by tenant_id first
    let query = supabase
      .from("events")
      .select(
        `
        *,
        events_groups!inner(
          group:groups(*)
        )
      `,
      )
      .eq("tenant_id", tenantId);

    // Apply date filters if provided
    if (startDate) {
      query = query.gte("date", startDate);
    }

    if (endDate) {
      query = query.lte("date", endDate);
    }

    // Get the data first
    const { data, error } = await query.order("date", { ascending: true });

    if (error) throw error;

    // Transform data to include groups properly
    let filteredData = data.map((event) => ({
      ...event,
      groups: event.events_groups.map((eventGroup) => eventGroup.group),
    }));

    // Filter by group if needed
    if (selectedGroup && selectedGroup !== "all") {
      filteredData = filteredData?.filter((event) =>
        event.events_groups?.some((eg) => eg.group.id === selectedGroup),
      );
    }

    return filteredData;
  } catch (error) {
    console.error("Error fetching tenant events:", error);
    throw error;
  }
}

/**
 * Get a single event by ID
 */
export async function getEventById(eventId: string): Promise<EventWithGroups | null> {
  try {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        *,
        events_groups!inner(
          group:groups(*)
        )
      `,
      )
      .eq("id", eventId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return {
      ...data,
      groups: data.events_groups.map((eventGroup) => eventGroup.group),
    };
  } catch (error) {
    console.error("Error fetching event by ID:", error);
    throw error;
  }
}
