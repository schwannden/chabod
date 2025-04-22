
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, ExternalLink, Book, Link, FileText, Video, Music, BarChart, Computer, Smartphone, Globe, FileImage, FileCog, FileCode, Package, Calendar, Mail, Users, Banknote, LayoutDashboard, Settings } from "lucide-react";
import { Resource, Group } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { deleteResource } from "@/lib/resource-service";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { EditResourceDialog } from "./EditResourceDialog";

const ICON_MAP: Record<string, any> = {
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

export function ResourceList({ resources, isLoading, onResourceUpdated, onResourceDeleted, canManage, groups = [] }: ResourceListProps) {
  const { toast } = useToast();
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDelete = async (id: string) => {
    try {
      await deleteResource(id);
      onResourceDeleted(id);
      toast({
        title: "資源已刪除",
        description: "資源已成功刪除",
      });
    } catch (error: any) {
      toast({
        title: "刪除資源失敗",
        description: error.message,
        variant: "destructive",
      });
    }
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
          {canManage && <p className="text-center text-muted-foreground mt-2">點擊右上角的「新增資源」按鈕來添加教會資源。</p>}
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
                {resource.description && (
                  <CardDescription>{resource.description}</CardDescription>
                )}
              </CardHeader>
              <CardFooter className="flex justify-between pt-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    打開連結
                  </a>
                </Button>
                {canManage && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(resource)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>確認刪除</AlertDialogTitle>
                          <AlertDialogDescription>
                            確定要刪除 "{resource.name}" 資源嗎？此操作無法撤銷。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(resource.id)}>刪除</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

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
