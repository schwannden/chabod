import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export interface TenantFormData {
  name: string;
  slug: string;
  // Metadata fields
  tax_id?: string;
  contact_email: string;
  address: string;
  website?: string;
  phone_number?: string;
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

export function TenantForm({
  initialValues,
  onSubmit,
  isProcessing,
  processingText,
  submitText,
  onCancel,
  autoGenerateSlug = false,
}: TenantFormProps) {
  const { t } = useTranslation("tenant");

  const formSchema = z.object({
    name: z.string().min(1, t("nameRequired")),
    slug: z
      .string()
      .min(1, t("slugRequired"))
      .regex(/^[a-z0-9-]+$/, t("slugPattern")),
    tax_id: z.string().optional(),
    contact_email: z.string().email(t("invalidEmail")).min(1, t("contactEmailRequired")),
    address: z.string().min(1, t("addressRequired")),
    website: z.string().url(t("invalidWebsite")).optional().or(z.literal("")),
    phone_number: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialValues.name || "",
      slug: initialValues.slug || "",
      tax_id: initialValues.tax_id || "",
      contact_email: initialValues.contact_email || "",
      address: initialValues.address || "",
      website: initialValues.website || "",
      phone_number: initialValues.phone_number || "",
    },
  });

  const watchName = form.watch("name");

  // Auto-generate slug from name if enabled
  if (autoGenerateSlug) {
    const slugValue = watchName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    if (slugValue !== form.getValues("slug")) {
      form.setValue("slug", slugValue);
    }
  }

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Basic tenant information */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("name")}</FormLabel>
              <FormControl>
                <Input placeholder={t("name")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("slug")}</FormLabel>
              <FormControl>
                <Input placeholder={t("slug")} {...field} />
              </FormControl>
              <FormMessage />
              <p className="text-xs text-muted-foreground">
                {t("name")}: /tenant/{field.value || "example"}
              </p>
            </FormItem>
          )}
        />

        {/* Metadata fields */}
        <div className="space-y-4 pt-4 border-t">
          <h4 className="font-medium text-sm">{t("churchInfo")}</h4>

          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("contactEmail")}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder={t("contactEmailPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("address")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("addressPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tax_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("taxId")}</FormLabel>
                <FormControl>
                  <Input placeholder={t("taxIdPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="website"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("website")}</FormLabel>
                <FormControl>
                  <Input type="url" placeholder={t("websitePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("phoneNumber")}</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder={t("phoneNumberPlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
    </Form>
  );
}
