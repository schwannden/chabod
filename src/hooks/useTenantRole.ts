import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// UUID validation function
function isUUID(value: string | undefined): boolean {
  if (!value) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export function useTenantRole(tenantIdOrSlug: string | undefined, userId: string | undefined) {
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // check if tenantIdOrSlug is a uuid or a slug
  const slug = isUUID(tenantIdOrSlug) ? null : tenantIdOrSlug;

  useEffect(() => {
    async function fetchTenantRole() {
      if (!tenantIdOrSlug || !userId) {
        console.log("Missing tenantIdOrSlug or userId:", { tenantIdOrSlug, userId });
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        let effectiveTenantId: string = tenantIdOrSlug;

        // If we have a slug, we need to get the tenant ID first
        if (slug) {
          const { data: tenantData, error: tenantError } = await supabase
            .from("tenants")
            .select("id")
            .eq("slug", slug)
            .single();

          if (tenantError) {
            console.error("Error fetching tenant by slug:", tenantError);
            setRole(null);
            setIsLoading(false);
            return;
          }

          effectiveTenantId = tenantData.id;
        }

        if (!effectiveTenantId) {
          console.log("Could not determine tenant ID");
          setRole(null);
          setIsLoading(false);
          return;
        }

        // Then get the role using the tenant ID
        const { data, error } = await supabase
          .from("tenant_members")
          .select("role")
          .eq("tenant_id", effectiveTenantId)
          .eq("user_id", userId)
          .single();

        if (error) {
          console.error("Error fetching tenant role:", error);
          setRole(null);
        } else {
          console.log("Tenant role data:", data);
          setRole(data?.role || null);
        }
      } catch (error) {
        console.error("Error in fetchTenantRole:", error);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTenantRole();
  }, [tenantIdOrSlug, userId, slug]);

  return { role, isLoading };
}
