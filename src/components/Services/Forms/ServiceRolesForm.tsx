
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
import { Edit2, Trash2, X, Check, Plus } from "lucide-react";
import { useState } from "react";

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const roleForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  const editForm = useForm<RoleFormValues>({
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
  
  const handleEditRole = (index: number) => {
    setEditingIndex(index);
    const role = roles[index];
    editForm.reset({
      name: role.name,
      description: role.description,
    });
  };

  const handleSaveEdit = (index: number) => {
    const values = editForm.getValues();
    if (editForm.formState.isValid) {
      const updatedRoles = [...roles];
      updatedRoles[index] = values;
      setRoles(updatedRoles);
      setEditingIndex(null);
    } else {
      editForm.trigger();
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleDeleteRole = (index: number) => {
    setRoles(roles.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
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
          <Button type="button" onClick={handleAddRole}>
            <Plus className="mr-2 h-4 w-4" />
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
                  {editingIndex === index ? (
                    <Form {...editForm}>
                      <form className="space-y-2">
                        <FormField
                          control={editForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input {...field} placeholder="角色名稱" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={editForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea {...field} placeholder="角色描述" rows={2} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            size="sm" 
                            variant="outline" 
                            onClick={handleCancelEdit}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">取消</span>
                          </Button>
                          <Button 
                            type="button" 
                            size="sm" 
                            onClick={() => handleSaveEdit(index)}
                          >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">儲存</span>
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">{role.name}</h5>
                        <p className="text-sm text-muted-foreground">
                          {role.description}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-500"
                          onClick={() => handleEditRole(index)}
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">編輯角色</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive/80"
                          onClick={() => handleDeleteRole(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">刪除角色</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
