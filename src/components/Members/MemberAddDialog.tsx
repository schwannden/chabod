import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { addMemberToTenant } from "@/lib/member-service";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export interface MemberAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
  onAddSuccess: () => void;
}

const createMemberAddSchema = (t: (key: string) => string) =>
  z
    .object({
      email: z
        .string()
        .min(1, t("members:emailRequired"))
        .email(t("members:pleaseEnterValidEmail")),
      role: z.enum(["member", "owner"]),
      isNewUser: z.boolean(),
      password: z.string().optional(),
      confirmPassword: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.isNewUser && (!data.password || data.password.length < 8)) {
          return false;
        }
        return true;
      },
      {
        message: t("members:passwordMinLength"),
        path: ["password"],
      },
    )
    .refine(
      (data) => {
        if (data.isNewUser && data.password !== data.confirmPassword) {
          return false;
        }
        return true;
      },
      {
        message: t("members:passwordMismatch"),
        path: ["confirmPassword"],
      },
    );

type MemberAddFormValues = z.infer<ReturnType<typeof createMemberAddSchema>>;

export function MemberAddDialog({
  isOpen,
  onClose,
  tenantSlug,
  onAddSuccess,
}: MemberAddDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const memberAddSchema = createMemberAddSchema(t);

  const form = useForm<MemberAddFormValues>({
    resolver: zodResolver(memberAddSchema),
    defaultValues: {
      email: "",
      role: "member",
      isNewUser: false,
      password: "",
      confirmPassword: "",
    },
  });

  // Check if user exists when email changes
  const watchEmail = form.watch("email");
  useEffect(() => {
    const checkUserExists = async () => {
      if (!watchEmail || !watchEmail.includes("@")) return;

      setIsCheckingUser(true);
      try {
        const { data: existingUser } = await supabase.auth.admin.getUserByEmail(watchEmail);
        const userExists = !!existingUser;
        setIsNewUser(!userExists);
        form.setValue("isNewUser", !userExists);
      } catch {
        setIsNewUser(true);
        form.setValue("isNewUser", true);
      } finally {
        setIsCheckingUser(false);
      }
    };

    const timeoutId = setTimeout(checkUserExists, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [watchEmail, form]);

  const onSubmit = async (values: MemberAddFormValues) => {
    setIsAdding(true);
    try {
      await addMemberToTenant(
        tenantSlug,
        values.email,
        values.role,
        values.isNewUser ? values.password : undefined,
      );

      toast({
        title: t("members:addMemberSuccess"),
        description: t("members:memberAddedSuccess", { email: values.email }),
      });

      form.reset();
      onAddSuccess();
      onClose();
    } catch (error) {
      toast({
        title: t("members:addMemberError"),
        description: (error as Error).message || t("members:unknownError"),
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("members:addMember")}</DialogTitle>
          <DialogDescription>{t("members:addMemberDesc")}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("members:emailAddress")}</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="example@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                  {isCheckingUser && (
                    <p className="text-sm text-muted-foreground">{t("members:checkingUser")}</p>
                  )}
                  {isNewUser && (
                    <p className="text-sm text-blue-600">{t("members:createNewMember")}</p>
                  )}
                </FormItem>
              )}
            />

            {/* Password Fields (conditionally shown for new users) */}
            {isNewUser && (
              <>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("members:password")}</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
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
                      <FormLabel>{t("members:confirmPassword")}</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Role Selection */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("members:role")}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t("members:selectRole")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">{t("members:generalMember")}</SelectItem>
                      <SelectItem value="owner">{t("members:admin")}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {t("common:cancel")}
              </Button>
              <Button type="submit" disabled={isAdding || isCheckingUser}>
                {isAdding ? t("members:addingMember") : t("members:addMember")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
