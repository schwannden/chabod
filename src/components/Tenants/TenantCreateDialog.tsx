
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export function TenantCreateDialog({ isOpen, onClose, userId, onTenantCreated }: TenantCreateDialogProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    
    // Auto-generate slug from name (lowercase, replace spaces with hyphens)
    const slugValue = value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setSlug(slugValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !slug.trim()) {
      toast({
        title: "Validation error",
        description: "Name and slug are required",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreating(true);
    
    try {
      await createTenant(name, slug, userId);
      toast({
        title: "Tenant created",
        description: `${name} has been created successfully.`,
      });
      onTenantCreated();
      onClose();
      setName("");
      setSlug("");
    } catch (error: any) {
      toast({
        title: "Error creating tenant",
        description: error.message || "An unknown error occurred",
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
            <Label htmlFor="name">Tenant Name</Label>
            <Input
              id="name"
              value={name}
              onChange={handleNameChange}
              placeholder="My Organization"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="slug">Tenant Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-organization"
              required
              pattern="^[a-z0-9-]+$"
              title="Lowercase letters, numbers, and hyphens only"
            />
            <p className="text-xs text-muted-foreground">
              This will be used in the URL: /tenant/{slug || "example"}
            </p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Tenant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
