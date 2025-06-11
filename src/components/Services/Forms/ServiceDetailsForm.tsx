import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ServiceFormValues } from "../hooks/useServiceForm";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

interface ServiceDetailsFormProps {
  form: ReturnType<typeof useForm<ServiceFormValues>>;
  initialValues?: ServiceFormValues;
  onSubmit?: (data: ServiceFormValues) => void;
  onCancel?: () => void;
  isProcessing?: boolean;
  submitLabel?: string;
  isEditing?: boolean;
}

export function ServiceDetailsForm({
  form,
  onSubmit,
  onCancel,
  isProcessing = false,
  submitLabel,
}: ServiceDetailsFormProps) {
  const { t } = useTranslation("services");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Trim the name on blur, but allow typing with spaces
    form.setValue("name", e.target.value);
  };

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Trim whitespace when field loses focus
    form.setValue("name", e.target.value.trim());
  };

  // If no onSubmit is provided, this is being used within a larger form (like ServiceForm)
  // In that case, just render the form fields without the form wrapper and buttons
  if (!onSubmit) {
    return (
      <div className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder=""
                  {...field}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="default_start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("defaultStartTime")}</FormLabel>
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
                <FormLabel>{t("defaultEndTime")}</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder=""
                  {...field}
                  onChange={handleNameChange}
                  onBlur={handleNameBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="default_start_time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("defaultStartTime")}</FormLabel>
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
                <FormLabel>{t("defaultEndTime")}</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("common:cancel")}
          </Button>
          <Button type="submit" disabled={isProcessing}>
            {isProcessing ? t("common:processing") : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
