import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useSession } from "@/hooks/useSession";
import { ResourceList } from "@/components/Resources/ResourceList";
import { CreateResourceDialog } from "@/components/Resources/CreateResourceDialog";
import { ResourceFilterBar } from "@/components/Resources/ResourceFilterBar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { Resource, Group } from "@/lib/types";
import { getResources, getResourceGroups } from "@/lib/resource-service";
import { useTenantRole } from "@/hooks/useTenantRole";
import { supabase } from "@/integrations/supabase/client";
import { TenantPageLayout } from "@/components/Layout/TenantPageLayout";
import { getTenantGroups } from "@/lib/group-service";

export default function ResourcePage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useSession();
  const [resources, setResources] = useState<Resource[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [resourceGroupMap, setResourceGroupMap] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [tenantName, setTenantName] = useState("");
  const [textFilter, setTextFilter] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const { role } = useTenantRole(slug, user?.id);
  const { toast } = useToast();

  useEffect(() => {
    if (!slug) return;

    const fetchTenantName = async () => {
      try {
        const { data, error } = await supabase
          .from("tenants")
          .select("id, name")
          .eq("slug", slug)
          .single();

        if (error) {
          console.error("Error fetching tenant name:", error);
        } else {
          setTenantName(data?.name || "");

          if (data?.id) {
            try {
              const groupsData = await getTenantGroups(data.id);
              setGroups(groupsData);
            } catch (groupError) {
              console.error("Error fetching groups:", groupError);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching tenant name:", error);
      }
    };

    fetchTenantName();
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    const fetchResources = async () => {
      try {
        const data = await getResources(slug);
        setResources(data);

        // Fetch group associations for each resource
        const groupMap: Record<string, string[]> = {};
        for (const resource of data) {
          try {
            const resourceGroups = await getResourceGroups(resource.id);
            groupMap[resource.id] = resourceGroups;
          } catch (error) {
            console.error(`Error fetching groups for resource ${resource.id}:`, error);
            groupMap[resource.id] = [];
          }
        }

        setResourceGroupMap(groupMap);
      } catch (error) {
        const errorMessage = error?.message || "未知錯誤";
        toast({
          title: "Error loading resources",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, [slug, toast]);

  const handleResourceCreated = (newResource: Resource) => {
    setResources((prev) => [newResource, ...prev]);
  };

  const handleResourceUpdated = (updatedResource: Resource) => {
    setResources((prev) =>
      prev.map((resource) => (resource.id === updatedResource.id ? updatedResource : resource)),
    );
  };

  const handleResourceDeleted = (id: string) => {
    setResources((prev) => prev.filter((resource) => resource.id !== id));
  };

  const filteredResources = resources.filter((resource) => {
    // Text filter logic
    const matchesText =
      textFilter === "" ||
      resource.name.toLowerCase().includes(textFilter.toLowerCase()) ||
      (resource.description?.toLowerCase() || "").includes(textFilter.toLowerCase()) ||
      resource.url.toLowerCase().includes(textFilter.toLowerCase());

    // Group filter logic
    const matchesGroup =
      selectedGroup === "all" ||
      (resourceGroupMap[resource.id] && resourceGroupMap[resource.id].includes(selectedGroup));

    return matchesText && matchesGroup;
  });

  return (
    <TenantPageLayout
      title="資源"
      tenantName={tenantName}
      tenantSlug={slug || ""}
      isLoading={isLoading}
      breadcrumbItems={[{ label: "資源" }]}
      action={
        role === "owner" && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 建立資源
          </Button>
        )
      }
    >
      <ResourceFilterBar
        textFilter={textFilter}
        setTextFilter={setTextFilter}
        selectedGroup={selectedGroup}
        setSelectedGroup={setSelectedGroup}
        groups={groups}
      />

      <ResourceList
        resources={filteredResources}
        isLoading={isLoading}
        onResourceUpdated={handleResourceUpdated}
        onResourceDeleted={handleResourceDeleted}
        canManage={role === "owner"}
        groups={groups}
      />

      <CreateResourceDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        tenantId={slug || ""}
        onResourceCreated={handleResourceCreated}
        groups={groups}
      />
    </TenantPageLayout>
  );
}
