
import { Service } from "@/lib/services";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteService } from "@/lib/services";
import { toast } from "sonner";

interface ServiceCardProps {
  service: Service;
  onEdit: (service: Service) => void;
  onDeleted: () => void;
}

export function ServiceCard({ service, onEdit, onDeleted }: ServiceCardProps) {
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
              編輯
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
          <Button variant="outline" className="w-full" onClick={() => {}}>
            服事人員
          </Button>
          <Button variant="outline" className="w-full" onClick={() => {}}>
            服事小組
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
