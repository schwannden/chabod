
import { useState } from "react";
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
import { createTenant } from "@/lib/tenant-utils";

interface TenantCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onTenantCreated: () => void;
}

export function TenantCreateDialog({
  isOpen,
  onClose,
  userId,
  onTenantCreated,
}: TenantCreateDialogProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    slug?: string;
  }>({});
  const { toast } = useToast();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setErrors((prev) => ({ ...prev, name: undefined }));

    // Auto-generate slug from name (lowercase, replace spaces with hyphens)
    const slugValue = value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    setSlug(slugValue);
    setErrors((prev) => ({ ...prev, slug: undefined }));
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

    setIsCreating(true);

    try {
      await createTenant(trimmedName, trimmedSlug, userId);
      toast({
        title: "Tenant created",
        description: `${trimmedName} has been created successfully.`,
      });
      onTenantCreated();
      onClose();
      setName("");
      setSlug("");
      setErrors({});
    } catch (error) {
      const errorMessage = error?.message || "未知錯誤";
      toast({
        title: "Error creating tenant",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Tenant</DialogTitle>
          <DialogDescription>
            Create a new tenant organization that you will own and manage.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">教會名稱</Label>
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
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={handleSlugChange}
              placeholder="my-organization"
              required
            />
            {errors.slug && <p className="text-sm text-destructive">{errors.slug}</p>}
            <p className="text-xs text-muted-foreground">
              這將會被用於 URL: /tenant/{slug || "example"}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "建立中..." : "建立教會"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
