import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useTenantRole(tenantId: string | undefined, userId: string | undefined) {
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTenantRole() {
      if (!tenantId || !userId) {
        console.log("Missing tenantId or userId:", { tenantId, userId });
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        // Then get the role using the tenant ID
        const { data, error } = await supabase
          .from("tenant_members")
          .select("role")
          .eq("tenant_id", tenantId)
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
  }, [tenantId, userId]);

  return { role, isLoading };
}
