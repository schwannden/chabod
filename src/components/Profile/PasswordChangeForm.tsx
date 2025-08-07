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
import { useSession } from "@/hooks/useSession";
import { updateUserPassword, verifyCurrentPassword } from "@/lib/auth-service";
import { useTranslation } from "react-i18next";

const createPasswordChangeSchema = (t: (key: string) => string) =>
  z
    .object({
      currentPassword: z.string().min(1, t("auth:currentPasswordRequired")),
      newPassword: z.string().min(8, t("auth:passwordMinLength")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("auth:passwordMismatch"),
      path: ["confirmPassword"],
    });

type PasswordChangeFormValues = z.infer<ReturnType<typeof createPasswordChangeSchema>>;

export function PasswordChangeForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordChangeSchema = createPasswordChangeSchema(t);

  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: PasswordChangeFormValues) => {
    if (!user?.email) {
      toast({
        title: t("profile:passwordChangeError"),
        description: t("profile:userNotFound"),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // First verify the current password
      await verifyCurrentPassword(user.email, values.currentPassword);

      // Update to new password
      await updateUserPassword(values.newPassword);

      toast({
        title: t("profile:passwordChangeSuccess"),
        description: t("profile:passwordChangedSuccessfully"),
      });

      // Clear the form
      form.reset();
    } catch (error) {
      toast({
        title: t("profile:passwordChangeError"),
        description: error instanceof Error ? error.message : t("profile:passwordChangeErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("profile:currentPassword")}</FormLabel>
              <FormControl>
                <Input type="password" placeholder={t("profile:enterCurrentPassword")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("profile:newPassword")}</FormLabel>
              <FormControl>
                <Input type="password" placeholder={t("profile:enterNewPassword")} {...field} />
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
              <FormLabel>{t("profile:confirmNewPassword")}</FormLabel>
              <FormControl>
                <Input type="password" placeholder={t("profile:confirmNewPassword")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("profile:changingPassword") : t("profile:changePassword")}
        </Button>
      </form>
    </Form>
  );
}
