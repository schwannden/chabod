
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useTenantRole(tenantSlug: string | undefined, userId: string | undefined) {
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTenantRole() {
      if (!tenantSlug || !userId) {
        console.log('Missing tenantSlug or userId:', { tenantSlug, userId });
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        // First get the tenant ID from the slug - this needs to be a proper slug, not a UUID
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .select("id")
          .eq("slug", tenantSlug)
          .single();

        if (tenantError) {
          console.error("Error fetching tenant:", tenantError);
          setRole(null);
          setIsLoading(false);
          return;
        }

        if (!tenantData) {
          console.error("Tenant not found");
          setRole(null);
          setIsLoading(false);
          return;
        }

        // Then get the role using the tenant ID
        const { data, error } = await supabase
          .from('tenant_members')
          .select('role')
          .eq('tenant_id', tenantData.id)
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Error fetching tenant role:', error);
          setRole(null);
        } else {
          console.log('Tenant role data:', data);
          setRole(data?.role || null);
        }
      } catch (error) {
        console.error('Error in fetchTenantRole:', error);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTenantRole();
  }, [tenantSlug, userId]);

  return { role, isLoading };
}
