
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogFooter } from "@/components/ui/dialog";

export interface TenantFormData {
  name: string;
  slug: string;
}

interface TenantFormProps {
  initialValues: TenantFormData;
  onSubmit: (values: TenantFormData) => void;
  isProcessing: boolean;
  processingText: string;
  submitText: string;
  onCancel: () => void;
  autoGenerateSlug?: boolean;
}

interface FormErrors {
  name?: string;
  slug?: string;
}

export function TenantForm({
  initialValues,
  onSubmit,
  isProcessing,
  processingText,
  submitText,
  onCancel,
  autoGenerateSlug = false,
}: TenantFormProps) {
  const [name, setName] = useState(initialValues.name);
  const [slug, setSlug] = useState(initialValues.slug);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setName(initialValues.name);
    setSlug(initialValues.slug);
    setErrors({});
  }, [initialValues]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    setErrors((prev) => ({ ...prev, name: undefined }));

    // Auto-generate slug from name if enabled
    if (autoGenerateSlug) {
      const slugValue = value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      setSlug(slugValue);
      setErrors((prev) => ({ ...prev, slug: undefined }));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    // Only allow lowercase letters, numbers and hyphens
    const sanitizedValue = value.replace(/[^a-z0-9-]/g, "");
    setSlug(sanitizedValue);
    setErrors((prev) => ({ ...prev, slug: undefined }));
  };

  const validateInputs = () => {
    const newErrors: FormErrors = {};
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { isValid, trimmedName, trimmedSlug } = validateInputs();
    
    if (!isValid) return;
    
    onSubmit({ 
      name: trimmedName,
      slug: trimmedSlug
    });
  };

  return (
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
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isProcessing}>
          {isProcessing ? processingText : submitText}
        </Button>
      </DialogFooter>
    </form>
  );
}
