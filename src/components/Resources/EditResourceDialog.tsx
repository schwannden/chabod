import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  updateResource,
  addResourceToGroup,
  removeResourceFromGroup,
  getResourceGroups,
} from "@/lib/resource-service";
import { Resource, Group } from "@/lib/types";
import { ResourceDetailsFields } from "./ResourceDetailsFields";

interface EditResourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  resource: Resource;
  onResourceUpdated: (resource: Resource) => void;
  groups: Group[];
}

export function EditResourceDialog({
  isOpen,
  onClose,
  resource,
  onResourceUpdated,
  groups = [],
}: EditResourceDialogProps) {
  const [name, setName] = useState(resource.name);
  const [description, setDescription] = useState(resource.description || "");
  const [url, setUrl] = useState(resource.url);
  const [icon, setIcon] = useState(resource.icon);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [urlError, setUrlError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const fetchResourceGroups = async () => {
        try {
          const groupIds = await getResourceGroups(resource.id);
          setSelectedGroups(groupIds);
        } catch (error) {
          console.error("Error fetching resource groups:", error);
        }
      };
      fetchResourceGroups();
    }
  }, [isOpen, resource.id]);

  const validateUrl = (url: string) => {
    const trimmedUrl = url.trim();
    try {
      new URL(trimmedUrl);
      setUrlError("");
      return true;
    } catch {
      setUrlError("請輸入有效的網址");
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const trimmedUrl = url.trim();

    if (!trimmedName || !trimmedUrl || !icon) {
      toast({
        title: "錯誤",
        description: "資源名稱、網址和圖示不能為空",
        variant: "destructive",
      });
      return;
    }

    if (!validateUrl(trimmedUrl)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedResource = await updateResource(resource.id, {
        name: trimmedName,
        description: trimmedDescription || null,
        url: trimmedUrl,
        icon,
      });

      const currentGroups = await getResourceGroups(resource.id);
      const groupsToAdd = selectedGroups.filter((g) => !currentGroups.includes(g));
      const groupsToRemove = currentGroups.filter((g) => !selectedGroups.includes(g));

      await Promise.all([
        ...groupsToAdd.map((groupId) => addResourceToGroup(resource.id, groupId)),
        ...groupsToRemove.map((groupId) => removeResourceFromGroup(resource.id, groupId)),
      ]);

      onResourceUpdated(updatedResource);
      toast({
        title: "資源已更新",
        description: "資源已成功更新",
      });
      onClose();
    } catch (error) {
      toast({
        title: "更新資源失敗",
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>編輯資源</DialogTitle>
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
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "更新中..." : "更新資源"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
