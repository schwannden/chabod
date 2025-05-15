import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  ExternalLink,
  Book,
  Link,
  FileText,
  Video,
  Music,
  BarChart,
  Computer,
  Smartphone,
  Globe,
  FileImage,
  FileCog,
  FileCode,
  Package,
  Calendar,
  Mail,
  Users,
  Banknote,
  LayoutDashboard,
  Settings,
  LucideProps,
} from "lucide-react";
import { Resource, Group } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteResource } from "@/lib/resource-service";
import { useToast } from "@/components/ui/use-toast";
import { EditResourceDialog } from "./EditResourceDialog";
import { ConfirmDeleteDialog } from "@/components/shared/ConfirmDeleteDialog";

type LucideIcon = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

const ICON_MAP: Record<string, LucideIcon> = {
  book: Book,
  link: Link,
  "file-text": FileText,
  video: Video,
  music: Music,
  "bar-chart": BarChart,
  computer: Computer,
  smartphone: Smartphone,
  globe: Globe,
  "file-image": FileImage,
  "file-cog": FileCog,
  "file-code": FileCode,
  package: Package,
  calendar: Calendar,
  mail: Mail,
  users: Users,
  banknote: Banknote,
  "layout-dashboard": LayoutDashboard,
  settings: Settings,
};

interface ResourceListProps {
  resources: Resource[];
  isLoading: boolean;
  onResourceUpdated: (resource: Resource) => void;
  onResourceDeleted: (id: string) => void;
  canManage: boolean;
  groups: Group[];
}

export function ResourceList({
  resources,
  isLoading,
  onResourceUpdated,
  onResourceDeleted,
  canManage,
  groups = [],
}: ResourceListProps) {
  const { toast } = useToast();
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteResourceId, setDeleteResourceId] = useState<string | null>(null);
  const [deleteResourceName, setDeleteResourceName] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteResourceId) return;
    
    try {
      setIsDeleting(true);
      await deleteResource(deleteResourceId);
      onResourceDeleted(deleteResourceId);
      toast({
        title: "資源已刪除",
        description: "資源已成功刪除",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "未知錯誤";
      toast({
        title: "刪除資源失敗",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const openDeleteDialog = (resource: Resource) => {
    setDeleteResourceId(resource.id);
    setDeleteResourceName(resource.name);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setIsEditDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-2/4" />
            </CardHeader>
            <CardContent className="pb-2">
              <Skeleton className="h-4 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center p-6">
          <p className="text-center text-muted-foreground">暫無資源</p>
          {canManage && (
            <p className="text-center text-muted-foreground mt-2">
              點擊右上角的「新增資源」按鈕來添加教會資源。
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((resource) => {
          const IconComponent = ICON_MAP[resource.icon] || Book;
          return (
            <Card key={resource.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <IconComponent className="h-5 w-5" />
                  <CardTitle>{resource.name}</CardTitle>
                </div>
                {resource.description && <CardDescription>{resource.description}</CardDescription>}
              </CardHeader>
              <CardFooter className="flex justify-between pt-2">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    打開連結
                  </a>
                </Button>
                {canManage && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(resource)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-destructive"
                      onClick={() => openDeleteDialog(resource)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="確認刪除"
        description={`確定要刪除 "${deleteResourceName}" 資源嗎？此操作無法撤銷。`}
        isLoading={isDeleting}
      />

      {editingResource && (
        <EditResourceDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          resource={editingResource}
          onResourceUpdated={onResourceUpdated}
          groups={groups}
        />
      )}
    </>
  );
}
