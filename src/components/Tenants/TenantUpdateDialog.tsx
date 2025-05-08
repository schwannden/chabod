
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tenant } from "@/lib/types";
import { updateTenant } from "@/lib/tenant-utils";

interface TenantUpdateDialogProps {
  tenant: Tenant;
  isOpen: boolean;
  onClose: () => void;
  onTenantUpdated: () => void;
}

export function TenantUpdateDialog({
  tenant,
  isOpen,
  onClose,
  onTenantUpdated,
}: TenantUpdateDialogProps) {
  const [name, setName] = useState(tenant.name);
  const [slug, setSlug] = useState(tenant.slug);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    slug?: string;
  }>({});
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setName(tenant.name);
      setSlug(tenant.slug);
      setErrors({});
    }
  }, [tenant, isOpen]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setErrors((prev) => ({ ...prev, name: undefined }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    // Only allow lowercase letters, numbers and hyphens
    const sanitizedValue = value.replace(/[^a-z0-9-]/g, "");
    setSlug(sanitizedValue);
    setErrors((prev) => ({ ...prev, slug: undefined }));
  };

  const validateInputs = () => {
    const newErrors: { name?: string; slug?: string } = {};
    let isValid = true;

    // Validate name (trim and check if empty)
    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = "教會名稱不能為空";
      isValid = false;
    }

    // Validate slug (check pattern and empty)
    const trimmedSlug = slug.trim();
    if (!trimmedSlug) {
      newErrors.slug = "Slug 不能為空";
      isValid = false;
    } else if (!/^[a-z0-9-]+$/.test(trimmedSlug)) {
      newErrors.slug = "Slug 只能包含小寫字母、數字和連字號";
      isValid = false;
    }

    setErrors(newErrors);
    return { isValid, trimmedName, trimmedSlug };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { isValid, trimmedName, trimmedSlug } = validateInputs();
    if (!isValid) return;

    setIsUpdating(true);

    try {
      await updateTenant(tenant.id, trimmedName, trimmedSlug);
      toast({
        title: "更新成功",
        description: `${trimmedName} 已更新。`,
      });
      onTenantUpdated();
      onClose();
    } catch (error) {
      const errorMessage = error?.message || "未知錯誤";
      toast({
        title: "Error updating tenant",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Tenant</DialogTitle>
          <DialogDescription>Update the details of your tenant organization.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tenant Name</Label>
            <Input
              id="name"
              value={name}
              onChange={handleNameChange}
              placeholder="My Organization"
              required
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Tenant Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={handleSlugChange}
              placeholder="my-organization"
              required
            />
            {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
            <p className="text-xs text-muted-foreground">
              This will be used in the URL: /tenant/{slug || tenant.slug}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "更新中..." : "更新教會資訊"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
