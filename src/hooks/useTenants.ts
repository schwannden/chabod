import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { getTenants } from "@/lib/tenant-utils";
import { TenantWithUsage } from "@/lib/types";

const TENANTS_QUERY_KEY = "tenants";

/**
 * Custom hook for managing tenant data with caching and optimized refetching
 */
export function useTenants() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const {
    data: tenants = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [TENANTS_QUERY_KEY, user?.id],
    queryFn: getTenants,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Function to invalidate and refetch tenant data
  const invalidateTenants = () => {
    queryClient.invalidateQueries({ queryKey: [TENANTS_QUERY_KEY, user?.id] });
  };

  // Function to update a specific tenant in the cache (for optimistic updates)
  const updateTenantInCache = (tenantId: string, updatedData: Partial<TenantWithUsage>) => {
    queryClient.setQueryData(
      [TENANTS_QUERY_KEY, user?.id],
      (oldData: TenantWithUsage[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map((tenant) =>
          tenant.id === tenantId ? { ...tenant, ...updatedData } : tenant,
        );
      },
    );
  };

  // Function to add a new tenant to the cache (for optimistic updates)
  const addTenantToCache = (newTenant: TenantWithUsage) => {
    queryClient.setQueryData(
      [TENANTS_QUERY_KEY, user?.id],
      (oldData: TenantWithUsage[] | undefined) => {
        if (!oldData) return [newTenant];
        return [...oldData, newTenant];
      },
    );
  };

  // Function to remove a tenant from the cache (for optimistic updates)
  const removeTenantFromCache = (tenantId: string) => {
    queryClient.setQueryData(
      [TENANTS_QUERY_KEY, user?.id],
      (oldData: TenantWithUsage[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.filter((tenant) => tenant.id !== tenantId);
      },
    );
  };

  return {
    tenants,
    isLoading,
    error,
    refetch,
    invalidateTenants,
    updateTenantInCache,
    addTenantToCache,
    removeTenantFromCache,
  };
}

/**
 * Hook to invalidate tenants cache from any component
 */
export function useInvalidateTenants() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: [TENANTS_QUERY_KEY, user?.id] });
  };
}
