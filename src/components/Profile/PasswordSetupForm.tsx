import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { updateUserPassword } from "@/lib/auth-service";
import { useTranslation } from "react-i18next";

const createPasswordSetupSchema = (t: (key: string) => string) =>
  z
    .object({
      newPassword: z.string().min(8, t("auth:passwordMinLength")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("auth:passwordMismatch"),
      path: ["confirmPassword"],
    });

type PasswordSetupFormValues = z.infer<ReturnType<typeof createPasswordSetupSchema>>;

export function PasswordSetupForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordSetupSchema = createPasswordSetupSchema(t);

  const form = useForm<PasswordSetupFormValues>({
    resolver: zodResolver(passwordSetupSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: PasswordSetupFormValues) => {
    setIsSubmitting(true);
    try {
      // Set the new password
      await updateUserPassword(values.newPassword);

      toast({
        title: t("profile:passwordSetupSuccess"),
        description: t("profile:passwordSetupSuccessfully"),
      });

      // Clear the form
      form.reset();
    } catch (error) {
      toast({
        title: t("profile:passwordSetupError"),
        description: error instanceof Error ? error.message : t("profile:passwordSetupErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">{t("profile:passwordSetupExplanation")}</div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("profile:password")}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder={t("profile:enterPassword")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("profile:confirmPassword")}</FormLabel>
                <FormControl>
                  <Input type="password" placeholder={t("profile:confirmPassword")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("profile:settingUpPassword") : t("profile:setupPassword")}
          </Button>
        </form>
      </Form>
    </div>
  );
}
