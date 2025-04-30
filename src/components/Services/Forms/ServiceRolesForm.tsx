
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const roleFormSchema = z.object({
  name: z.string().min(1, "角色名稱為必填"),
  description: z.string().optional(),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;

interface ServiceRolesFormProps {
  roles: RoleFormValues[];
  setRoles: React.Dispatch<React.SetStateAction<RoleFormValues[]>>;
}

export function ServiceRolesForm({ roles, setRoles }: ServiceRolesFormProps) {
  const roleForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const handleAddRole = () => {
    const values = roleForm.getValues();
    if (roleForm.formState.isValid) {
      setRoles([...roles, values]);
      roleForm.reset();
    } else {
      roleForm.trigger();
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">新增服事角色</h3>
      <Form {...roleForm}>
        <form className="space-y-4">
          <FormField
            control={roleForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>角色名稱</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="角色名稱" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={roleForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>角色描述</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="角色描述" rows={2} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="button" onClick={handleAddRole}>
            新增角色
          </Button>
        </form>
      </Form>

      {roles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">已新增角色</h4>
          <ScrollArea className="h-40 border rounded-md p-2">
            <div className="space-y-2">
              {roles.map((role, index) => (
                <div key={index} className="bg-secondary p-2 rounded-md">
                  <h5 className="font-medium">{role.name}</h5>
                  <p className="text-sm text-muted-foreground">
                    {role.description}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
