import { useState } from "react";
import { Service } from "@/lib/services";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash, UserPlus, Users, FilePlus, ShieldPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteService } from "@/lib/services";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  ServiceAdminView,
  ServiceGroupView,
  ServiceNoteView,
  ServiceRoleView,
} from "./ServiceViews";
import { ServiceDeleteDialog } from "./ServiceDeleteDialog";
import { useTranslation } from "react-i18next";

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDeleted: () => void;
}

export function ServiceCard({ service, onEdit, onDeleted }: ServiceCardProps) {
  const { t } = useTranslation();
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteService(service.id);
      toast({
        title: t("services.serviceTypeDeleted"),
        description: "",
      });
      onDeleted();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: "Error",
        description: t("services.deleteServiceTypeError"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">{service.name}</CardTitle>
          <CardDescription>
            {service.default_start_time && service.default_end_time
              ? `${service.default_start_time} - ${service.default_end_time}`
              : t("services.notSetDefaultTime")}
          </CardDescription>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(service)}>
              <Pencil className="mr-2 h-4 w-4" />
              編輯基本資料
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash className="mr-2 h-4 w-4" />
              刪除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <Sheet
            open={activeSheet === "admins"}
            onOpenChange={(open) => setActiveSheet(open ? "admins" : null)}
          >
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <UserPlus className="mr-2 h-4 w-4" />
                服事管理員
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{service.name} - 服事管理員</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <ServiceAdminView serviceId={service.id} />
              </div>
            </SheetContent>
          </Sheet>

          <Sheet
            open={activeSheet === "groups"}
            onOpenChange={(open) => setActiveSheet(open ? "groups" : null)}
          >
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                服事小組
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{service.name} - 服事小組</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <ServiceGroupView serviceId={service.id} />
              </div>
            </SheetContent>
          </Sheet>

          <Sheet
            open={activeSheet === "notes"}
            onOpenChange={(open) => setActiveSheet(open ? "notes" : null)}
          >
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <FilePlus className="mr-2 h-4 w-4" />
                服事備註
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{service.name} - 服事備註</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <ServiceNoteView serviceId={service.id} />
              </div>
            </SheetContent>
          </Sheet>

          <Sheet
            open={activeSheet === "roles"}
            onOpenChange={(open) => setActiveSheet(open ? "roles" : null)}
          >
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <ShieldPlus className="mr-2 h-4 w-4" />
                服事角色
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{service.name} - 服事角色</SheetTitle>
              </SheetHeader>
              <div className="py-4">
                <ServiceRoleView serviceId={service.id} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </CardContent>

      <ServiceDeleteDialog
        service={service}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </Card>
  );
}
