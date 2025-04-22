
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

export function TenantUpdateDialog({ tenant, isOpen, onClose, onTenantUpdated }: TenantUpdateDialogProps) {
  const [name, setName] = useState(tenant.name);
  const [slug, setSlug] = useState(tenant.slug);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setName(tenant.name);
    setSlug(tenant.slug);
  }, [tenant, isOpen]);

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
    
    setIsUpdating(true);
    
    try {
      await updateTenant(tenant.id, name, slug);
      toast({
        title: "Tenant updated",
        description: `${name} has been updated successfully.`,
      });
      onTenantUpdated();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error updating tenant",
        description: error.message || "An unknown error occurred",
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
          <DialogDescription>
            Update the details of your tenant organization.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tenant Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              This will be used in the URL: /tenant/{slug || tenant.slug}
            </p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? "Updating..." : "Update Tenant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
