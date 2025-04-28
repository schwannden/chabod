
import { useForm } from "react-hook-form";
import { Service } from "@/lib/services";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
import { createService } from "@/lib/services";

interface CreateServiceDialogProps {
  tenantId: string;
  onSuccess?: () => void;
}

export function CreateServiceDialog({ tenantId, onSuccess }: CreateServiceDialogProps) {
  const form = useForm<Omit<Service, "id" | "created_at" | "updated_at">>({
    defaultValues: {
      name: "",
      tenant_id: tenantId,
      default_start_time: "",
      default_end_time: "",
    },
  });

  const onSubmit = async (values: Omit<Service, "id" | "created_at" | "updated_at">) => {
    try {
      await createService(values);
      toast.success("服事類型已新增");
      form.reset();
      onSuccess?.();
    } catch (error) {
      console.error("Error creating service:", error);
      toast.error("新增服事類型時發生錯誤");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          新增服事類型
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增服事類型</DialogTitle>
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
            <Button type="submit">新增</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
