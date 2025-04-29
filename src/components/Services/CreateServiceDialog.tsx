
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
import { Plus, UserPlus, Users, FilePlus, ShieldPlus } from "lucide-react";
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
import { toast } from "sonner";
import { 
  createService, 
  addServiceAdmin, 
  addServiceNote,
  addServiceRole,
  addServiceGroup
} from "@/lib/services";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TenantMemberWithProfile } from "@/lib/types";
import { Group } from "@/lib/types";
import { getTenantMembers } from "@/lib/member-service";
import { getTenantGroups } from "@/lib/group-service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface CreateServiceDialogProps {
  tenantId: string;
  onSuccess?: () => void;
}

const serviceFormSchema = z.object({
  name: z.string().min(1, "名稱為必填"),
  tenant_id: z.string(),
  default_start_time: z.string().optional(),
  default_end_time: z.string().optional(),
});

const noteFormSchema = z.object({
  title: z.string().min(1, "標題為必填"),
  content: z.string().optional(),
});

const roleFormSchema = z.object({
  name: z.string().min(1, "角色名稱為必填"),
  description: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;
type NoteFormValues = z.infer<typeof noteFormSchema>;
type RoleFormValues = z.infer<typeof roleFormSchema>;

export function CreateServiceDialog({ tenantId, onSuccess }: CreateServiceDialogProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [members, setMembers] = useState<TenantMemberWithProfile[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedAdmins, setSelectedAdmins] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [notes, setNotes] = useState<NoteFormValues[]>([]);
  const [roles, setRoles] = useState<RoleFormValues[]>([]);
  const [open, setOpen] = useState(false);

  // Service form
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      tenant_id: tenantId,
      default_start_time: "",
      default_end_time: "",
    },
  });

  // Note form
  const noteForm = useForm<NoteFormValues>({
    resolver: zodResolver(noteFormSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });

  // Role form
  const roleForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Fetch tenant members and groups when dialog opens
  useEffect(() => {
    if (open) {
      fetchTenantMembers();
      fetchTenantGroups();
    }
  }, [open, tenantId]);

  const fetchTenantMembers = async () => {
    try {
      const fetchedMembers = await getTenantMembers(tenantId);
      setMembers(fetchedMembers);
    } catch (error) {
      console.error("Error fetching tenant members:", error);
      toast.error("載入成員時發生錯誤");
    }
  };

  const fetchTenantGroups = async () => {
    try {
      const fetchedGroups = await getTenantGroups(tenantId);
      setGroups(fetchedGroups);
    } catch (error) {
      console.error("Error fetching tenant groups:", error);
      toast.error("載入小組時發生錯誤");
    }
  };

  const handleAddNote = () => {
    const values = noteForm.getValues();
    if (noteForm.formState.isValid) {
      setNotes([...notes, values]);
      noteForm.reset();
      toast.success("已新增備註");
    } else {
      noteForm.trigger();
    }
  };

  const handleAddRole = () => {
    const values = roleForm.getValues();
    if (roleForm.formState.isValid) {
      setRoles([...roles, values]);
      roleForm.reset();
      toast.success("已新增角色");
    } else {
      roleForm.trigger();
    }
  };

  const onSubmit = async (values: ServiceFormValues) => {
    try {
      // Ensure name is required
      if (!values.name) {
        toast.error("服事類型名稱為必填");
        return;
      }
      
      // Create service
      const service = await createService({
        name: values.name,
        tenant_id: values.tenant_id,
        default_start_time: values.default_start_time || null,
        default_end_time: values.default_end_time || null,
      });
      
      // Add selected admins
      for (const adminId of selectedAdmins) {
        await addServiceAdmin(service.id, adminId);
      }
      
      // Add notes - use text property instead of title and remove content
      for (const note of notes) {
        await addServiceNote({
          service_id: service.id,
          text: note.title,
          tenant_id: tenantId,
          // Note: link property is optional in the schema so we don't need to specify it
        });
      }
      
      // Add roles - only use name property
      for (const role of roles) {
        await addServiceRole({
          service_id: service.id,
          name: role.name,
          tenant_id: tenantId,
        });
      }
      
      // Add selected groups
      for (const groupId of selectedGroups) {
        await addServiceGroup({
          service_id: service.id,
          group_id: groupId,
        });
      }
      
      toast.success("服事類型已新增");
      handleDialogClose();
      onSuccess?.();
    } catch (error) {
      console.error("Error creating service:", error);
      toast.error("新增服事類型時發生錯誤");
    }
  };

  const handleDialogClose = () => {
    setOpen(false);
    setActiveTab("details");
    form.reset();
    noteForm.reset();
    roleForm.reset();
    setSelectedAdmins([]);
    setSelectedGroups([]);
    setNotes([]);
    setRoles([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          新增服事類型
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>新增服事類型</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="details">基本資料</TabsTrigger>
            <TabsTrigger value="admins">管理員</TabsTrigger>
            <TabsTrigger value="groups">小組</TabsTrigger>
            <TabsTrigger value="notes">備註</TabsTrigger>
            <TabsTrigger value="roles">角色</TabsTrigger>
          </TabsList>
          
          {/* Basic Details */}
          <TabsContent value="details">
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
                <div className="grid grid-cols-2 gap-4">
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
                </div>
              </form>
            </Form>
          </TabsContent>
          
          {/* Service Admins */}
          <TabsContent value="admins">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">選擇服事管理員</h3>
              <ScrollArea className="h-72 border rounded-md p-2">
                <div className="space-y-2">
                  {members.length > 0 ? (
                    members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`admin-${member.user_id}`}
                          checked={selectedAdmins.includes(member.user_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAdmins([...selectedAdmins, member.user_id]);
                            } else {
                              setSelectedAdmins(selectedAdmins.filter(id => id !== member.user_id));
                            }
                          }}
                        />
                        <label htmlFor={`admin-${member.user_id}`} className="text-sm font-medium">
                          {member.profile?.full_name || member.profile?.email || "匿名成員"}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">尚未有成員</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
          
          {/* Service Groups */}
          <TabsContent value="groups">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">選擇服事小組</h3>
              <ScrollArea className="h-72 border rounded-md p-2">
                <div className="space-y-2">
                  {groups.length > 0 ? (
                    groups.map((group) => (
                      <div key={group.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`group-${group.id}`}
                          checked={selectedGroups.includes(group.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedGroups([...selectedGroups, group.id]);
                            } else {
                              setSelectedGroups(selectedGroups.filter(id => id !== group.id));
                            }
                          }}
                        />
                        <label htmlFor={`group-${group.id}`} className="text-sm font-medium">
                          {group.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">尚未有小組</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
          
          {/* Service Notes */}
          <TabsContent value="notes">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">新增服事備註</h3>
              <Form {...noteForm}>
                <form className="space-y-4">
                  <FormField
                    control={noteForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>標題</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="備註標題" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={noteForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>內容</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="備註內容" rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" onClick={handleAddNote}>新增備註</Button>
                </form>
              </Form>
              
              {notes.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">已新增備註</h4>
                  <ScrollArea className="h-40 border rounded-md p-2">
                    <div className="space-y-2">
                      {notes.map((note, index) => (
                        <div key={index} className="bg-secondary p-2 rounded-md">
                          <h5 className="font-medium">{note.title}</h5>
                          <p className="text-sm text-muted-foreground">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Service Roles */}
          <TabsContent value="roles">
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
                  <Button type="button" onClick={handleAddRole}>新增角色</Button>
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
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={handleDialogClose}>取消</Button>
          <Button onClick={form.handleSubmit(onSubmit)}>新增服事類型</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
