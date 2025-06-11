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
import { toast } from "sonner";
import { addServiceRole, deleteServiceRoles } from "@/lib/services";
import { useTranslation } from "react-i18next";

const createRoleFormSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("roleNameRequired")),
    description: z.string().optional(),
  });

export type RoleFormValues = z.infer<ReturnType<typeof createRoleFormSchema>>;

interface ServiceRolesFormProps {
  roles: RoleFormValues[];
  setRoles: React.Dispatch<React.SetStateAction<RoleFormValues[]>>;
  serviceId?: string;
  tenantId?: string;
  isEditing: boolean;
}

export function ServiceRolesForm({
  roles,
  setRoles,
  serviceId,
  tenantId,
  isEditing,
}: ServiceRolesFormProps) {
  const { t } = useTranslation("services");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const roleFormSchema = createRoleFormSchema(t);

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

  const handleAddRole = async () => {
    const values = roleForm.getValues();
    if (roleForm.formState.isValid) {
      try {
        // Add role to database if editing an existing service
        if (isEditing && serviceId && tenantId) {
          await addServiceRole({
            service_id: serviceId,
            tenant_id: tenantId,
            name: values.name,
            description: values.description || null,
          });
        }

        // Always update local state
        setRoles([...roles, values]);
        roleForm.reset();
      } catch (error) {
        console.error("Error adding service role:", error);
        toast.error(t("errorAddingRole"));
      }
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

  const handleSaveEdit = async (index: number) => {
    const values = editForm.getValues();
    if (editForm.formState.isValid) {
      try {
        // For editing existing roles, we delete all and re-add them
        // since there's no direct update function
        if (isEditing && serviceId && tenantId) {
          await deleteServiceRoles(serviceId);

          // Prepare updated roles list
          const updatedRoles = [...roles];
          updatedRoles[index] = values;

          // Re-add all roles to the database
          for (const role of updatedRoles) {
            await addServiceRole({
              service_id: serviceId,
              tenant_id: tenantId,
              name: role.name,
              description: role.description || null,
            });
          }

          // Update local state
          setRoles(updatedRoles);
        } else {
          // Just update local state for new services
          const updatedRoles = [...roles];
          updatedRoles[index] = values;
          setRoles(updatedRoles);
        }

        setEditingIndex(null);
      } catch (error) {
        console.error("Error updating service role:", error);
        toast.error(t("errorUpdatingRole"));
      }
    } else {
      editForm.trigger();
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleDeleteRole = async (index: number) => {
    try {
      // For deleting roles, we delete all and re-add the remaining ones
      if (isEditing && serviceId && tenantId) {
        await deleteServiceRoles(serviceId);

        // Filter out the deleted role
        const updatedRoles = roles.filter((_, i) => i !== index);

        // Re-add all remaining roles
        for (const role of updatedRoles) {
          await addServiceRole({
            service_id: serviceId,
            tenant_id: tenantId,
            name: role.name,
            description: role.description || null,
          });
        }

        // Update local state
        setRoles(updatedRoles);
      } else {
        // Just update local state for new services
        setRoles(roles.filter((_, i) => i !== index));
      }

      if (editingIndex === index) {
        setEditingIndex(null);
      }
    } catch (error) {
      console.error("Error deleting service role:", error);
      toast.error(t("errorDeletingRole"));
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{t("addServiceRoles")}</h3>
      <Form {...roleForm}>
        <form className="space-y-4">
          <FormField
            control={roleForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("roleName")}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder={t("roleName")} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="button" onClick={handleAddRole}>
            <Plus className="mr-2 h-4 w-4" />
            {t("addRole")}
          </Button>
        </form>
      </Form>

      {roles.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">{t("addedRoles")}</h4>
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
                                <Input {...field} placeholder={t("roleName")} />
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
                                <Textarea {...field} placeholder={t("roleDescription")} rows={2} />
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
                            <span className="sr-only">{t("cancel")}</span>
                          </Button>
                          <Button type="button" size="sm" onClick={() => handleSaveEdit(index)}>
                            <Check className="h-4 w-4" />
                            <span className="sr-only">{t("save")}</span>
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-medium">{role.name}</h5>
                        <p className="text-sm text-muted-foreground">{role.description}</p>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-500"
                          onClick={() => handleEditRole(index)}
                        >
                          <Edit2 className="h-4 w-4" />
                          <span className="sr-only">{t("editRole")}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive/80"
                          onClick={() => handleDeleteRole(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{t("deleteRole")}</span>
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
