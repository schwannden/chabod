
import { Service } from "@/lib/services";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getServiceAdminsWithProfiles } from "@/lib/services/service-admin";
import { getGroupsForService } from "@/lib/services/service-groups";
import { getServiceNotes } from "@/lib/services/service-notes";
import { getServiceRoles } from "@/lib/services/service-roles";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDeleted: () => void;
}

export function ServiceCard({ service, onEdit, onDeleted }: ServiceCardProps) {
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      await deleteService(service.id);
      toast.success("服事類型已刪除");
      onDeleted();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error("刪除服事類型時發生錯誤");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl">{service.name}</CardTitle>
          <CardDescription>
            {service.default_start_time && service.default_end_time ? 
              `${service.default_start_time} - ${service.default_end_time}` : 
              "未設定預設時間"}
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
            <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
              <Trash className="mr-2 h-4 w-4" />
              刪除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <Sheet open={activeSheet === 'admins'} onOpenChange={(open) => setActiveSheet(open ? 'admins' : null)}>
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
          
          <Sheet open={activeSheet === 'groups'} onOpenChange={(open) => setActiveSheet(open ? 'groups' : null)}>
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
          
          <Sheet open={activeSheet === 'notes'} onOpenChange={(open) => setActiveSheet(open ? 'notes' : null)}>
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
          
          <Sheet open={activeSheet === 'roles'} onOpenChange={(open) => setActiveSheet(open ? 'roles' : null)}>
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
    </Card>
  );
}

// Component for displaying service admins
function ServiceAdminView({ serviceId }: { serviceId: string }) {
  const { data: admins = [], isLoading, error } = useQuery({
    queryKey: ["serviceAdmins", serviceId],
    queryFn: () => getServiceAdminsWithProfiles(serviceId),
  });

  if (isLoading) return <div className="text-center py-4">載入中...</div>;
  if (error) return <div className="text-red-500">載入失敗</div>;
  
  return (
    <div className="space-y-4">
      {admins.length === 0 ? (
        <p className="text-muted-foreground text-center">尚未指定服事管理員</p>
      ) : (
        <div className="space-y-2">
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center gap-2 p-2 rounded-md border">
              <div className="flex-1">
                <div className="font-medium">{admin.profile?.name || admin.user_email}</div>
                <div className="text-sm text-muted-foreground">{admin.user_email}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Component for displaying service groups
function ServiceGroupView({ serviceId }: { serviceId: string }) {
  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: ["serviceGroups", serviceId],
    queryFn: () => getGroupsForService(serviceId),
  });

  if (isLoading) return <div className="text-center py-4">載入中...</div>;
  if (error) return <div className="text-red-500">載入失敗</div>;

  return (
    <div className="space-y-4">
      {groups.length === 0 ? (
        <p className="text-muted-foreground text-center">尚未指定服事小組</p>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => (
            <div key={group.id} className="flex items-center gap-2 p-2 rounded-md border">
              <div className="font-medium">{group.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Component for displaying service notes
function ServiceNoteView({ serviceId }: { serviceId: string }) {
  const { data: notes = [], isLoading, error } = useQuery({
    queryKey: ["serviceNotes", serviceId],
    queryFn: () => getServiceNotes(serviceId),
  });

  if (isLoading) return <div className="text-center py-4">載入中...</div>;
  if (error) return <div className="text-red-500">載入失敗</div>;

  return (
    <div className="space-y-4">
      {notes.length === 0 ? (
        <p className="text-muted-foreground text-center">尚未添加服事備註</p>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {notes.map((note, index) => (
            <AccordionItem key={note.id || index} value={note.id || `note-${index}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="font-medium truncate">{note.text.substring(0, 30)}{note.text.length > 30 ? '...' : ''}</div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="whitespace-pre-wrap mb-2">{note.text}</p>
                {note.link && (
                  <a 
                    href={note.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm block"
                  >
                    {note.link}
                  </a>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

// Component for displaying service roles
function ServiceRoleView({ serviceId }: { serviceId: string }) {
  const { data: roles = [], isLoading, error } = useQuery({
    queryKey: ["serviceRoles", serviceId],
    queryFn: () => getServiceRoles(serviceId),
  });

  if (isLoading) return <div className="text-center py-4">載入中...</div>;
  if (error) return <div className="text-red-500">載入失敗</div>;

  return (
    <div className="space-y-4">
      {roles.length === 0 ? (
        <p className="text-muted-foreground text-center">尚未添加服事角色</p>
      ) : (
        <div className="space-y-3">
          {roles.map((role, index) => (
            <div key={role.id || index} className="border rounded-md p-3">
              <Badge variant="outline">{role.name}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
