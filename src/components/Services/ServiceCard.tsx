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
import { useToast } from "@/components/ui/use-toast";
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
  const { toast } = useToast();
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteService(service.id);
      toast({
        title: t("services.serviceTypeDeleted"),
        description: t("services.serviceDeletedSuccess"),
      });
      onDeleted();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({
        title: t("common.error"),
        description: t("services.deleteServiceTypeError"),
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDropdownOpen(false); // Close dropdown first
    setIsDeleteDialogOpen(true);
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
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(service)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t("services.editBasicInfo")}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={handleDeleteClick}>
              <Trash className="mr-2 h-4 w-4" />
              {t("common.delete")}
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
                {t("services.serviceAdmins")}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>
                  {service.name} - {t("services.serviceAdmins")}
                </SheetTitle>
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
                {t("services.serviceGroups")}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>
                  {service.name} - {t("services.serviceGroups")}
                </SheetTitle>
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
                {t("services.serviceNotes")}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>
                  {service.name} - {t("services.serviceNotes")}
                </SheetTitle>
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
                {t("services.serviceRoles")}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>
                  {service.name} - {t("services.serviceRoles")}
                </SheetTitle>
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
