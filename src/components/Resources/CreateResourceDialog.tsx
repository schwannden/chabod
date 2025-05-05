import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { createResource, addResourceToGroup } from "@/lib/resource-service";
import { Resource, Group } from "@/lib/types";
import { supabase } from "@/integrations/supabase/client";
import { ResourceDetailsFields } from "./ResourceDetailsFields";

interface CreateResourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  onResourceCreated: (resource: Resource) => void;
  groups: Group[];
}

export function CreateResourceDialog({
  isOpen,
  onClose,
  tenantId,
  onResourceCreated,
  groups = [],
}: CreateResourceDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("book");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlError, setUrlError] = useState("");
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setDescription("");
    setUrl("");
    setIcon("book");
    setSelectedGroups([]);
    setUrlError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      setUrlError("");
      return true;
    } catch {
      setUrlError("請輸入有效的網址");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !url || !icon) {
      toast({
        title: "錯誤",
        description: "資源名稱、網址和圖示不能為空",
        variant: "destructive",
      });
      return;
    }

    if (!validateUrl(url)) {
      return;
    }

    if (!tenantId) {
      toast({
        title: "錯誤",
        description: "無法獲取教會ID",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: tenantData, error: tenantError } = await supabase
        .from("tenants")
        .select("id")
        .eq("slug", tenantId)
        .single();

      if (tenantError) {
        throw tenantError;
      }

      if (!tenantData) {
        throw new Error("Tenant not found");
      }

      const newResource = await createResource({
        tenant_id: tenantData.id,
        name,
        description,
        url,
        icon,
      });

      await Promise.all(
        selectedGroups.map((groupId) => addResourceToGroup(newResource.id, groupId)),
      );

      onResourceCreated(newResource);
      toast({
        title: "資源已創建",
        description: "新資源已成功添加",
      });
      resetForm();
      onClose();
    } catch (error) {
      toast({
        title: "創建資源失敗",
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId],
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新增資源</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <ResourceDetailsFields
            name={name}
            description={description}
            url={url}
            icon={icon}
            selectedGroups={selectedGroups}
            groups={groups}
            urlError={urlError}
            onNameChange={setName}
            onDescriptionChange={setDescription}
            onUrlChange={(value) => {
              setUrl(value);
              if (value) validateUrl(value);
            }}
            onIconChange={setIcon}
            onGroupToggle={handleGroupToggle}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "創建中..." : "創建資源"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
