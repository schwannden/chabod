import { useState, useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { updateUserProfile } from "@/lib/profile-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useTranslation } from "react-i18next";
import { Profile } from "@/lib/types";

interface ProfileFormProps {
  profile: Profile;
  onProfileUpdated?: () => void;
}

export function ProfileForm({ profile, onProfileUpdated }: ProfileFormProps) {
  const { user, refetchProfile } = useSession();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    first_name: "",
    last_name: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      await updateUserProfile(user.id, formData);
      await refetchProfile();
      if (onProfileUpdated) {
        onProfileUpdated();
      }
      toast({
        title: t("profile:profileUpdated"),
        description: t("profile:profileUpdatedSuccess"),
      });
    } catch (error: unknown) {
      console.error("Profile update error:", error);
      toast({
        title: t("profile:profileUpdateError"),
        description: error instanceof Error ? error.message : t("profile:profileUpdateErrorDesc"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t("profile:title")}</CardTitle>
        <CardDescription>{t("profile:description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full-name">{t("profile:fullName")}</Label>
            <Input
              id="full-name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
              placeholder={t("profile:yourName")}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first-name">{t("profile:firstName")}</Label>
              <Input
                id="first-name"
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, first_name: e.target.value }))}
                placeholder={t("profile:firstName_")}
              />
            </div>
            <div>
              <Label htmlFor="last-name">{t("profile:lastName")}</Label>
              <Input
                id="last-name"
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, last_name: e.target.value }))}
                placeholder={t("profile:lastName_")}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">{t("profile:email")}</Label>
            <Input id="email" type="email" value={user?.email || ""} disabled />
            <p className="text-xs text-muted-foreground">{t("profile:emailNote")}</p>
          </div>
          <div>
            <Label htmlFor="avatar-url">{t("profile:avatarUrl")}</Label>
            <Input
              id="avatar-url"
              type="url"
              value={formData.avatar_url}
              onChange={(e) => setFormData((prev) => ({ ...prev, avatar_url: e.target.value }))}
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? t("common:saving") : t("profile:saveChanges")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
