
import { useForm } from "react-hook-form";
import { Service } from "@/lib/services";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { updateService } from "@/lib/services";

interface EditServiceDialogProps {
  service: Service;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditServiceDialog({ 
  service, 
  open, 
  onOpenChange, 
  onSuccess 
}: EditServiceDialogProps) {
  const form = useForm<Omit<Service, "id" | "created_at" | "updated_at">>({
    defaultValues: {
      name: service.name,
      tenant_id: service.tenant_id,
      default_start_time: service.default_start_time ?? "",
      default_end_time: service.default_end_time ?? "",
    },
  });

  const onSubmit = async (values: Omit<Service, "id" | "created_at" | "updated_at">) => {
    try {
      await updateService(service.id, values);
      toast.success("服事類型已更新");
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating service:", error);
      toast.error("更新服事類型時發生錯誤");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯服事類型</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名稱</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="default_start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>預設開始時間</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="default_end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>預設結束時間</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">更新</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
