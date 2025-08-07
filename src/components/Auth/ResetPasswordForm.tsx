import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

const createResetPasswordSchema = (t: (key: string) => string) =>
  z
    .object({
      newPassword: z.string().min(8, t("auth:passwordMinLength")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("auth:passwordMismatch"),
      path: ["confirmPassword"],
    });

type ResetPasswordFormValues = z.infer<ReturnType<typeof createResetPasswordSchema>>;

interface ResetPasswordFormProps {
  onSuccess: () => void;
}

export function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetPasswordSchema = createResetPasswordSchema(t);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      // Update to new password (user is already authenticated via reset token)
      await updateUserPassword(values.newPassword);

      toast({
        title: t("auth:resetPasswordSuccess"),
        description: t("auth:passwordResetSuccessfully"),
      });

      // Clear the form and call success callback
      form.reset();
      onSuccess();
    } catch (error) {
      toast({
        title: t("auth:resetPasswordError"),
        description: error instanceof Error ? error.message : t("auth:resetPasswordErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t("auth:setNewPassword")}</CardTitle>
        <CardDescription>{t("auth:setNewPasswordDesc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("auth:newPassword")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t("auth:enterNewPassword")}
                      {...field}
                      disabled={isSubmitting}
                    />
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
                  <FormLabel>{t("auth:confirmNewPassword")}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={t("auth:confirmNewPassword")}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t("auth:updatingPassword") : t("auth:updatePassword")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
