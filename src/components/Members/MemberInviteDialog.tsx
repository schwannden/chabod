import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { inviteMemberToTenant } from "@/lib/member-service";
import { useTranslation } from "react-i18next";

export interface MemberInviteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tenantSlug: string;
  onInviteSuccess: () => void;
}

export function MemberInviteDialog({
  isOpen,
  onClose,
  tenantSlug,
  onInviteSuccess,
}: MemberInviteDialogProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: t("members:validationError"),
        description: t("members:emailRequired"),
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);
    try {
      await inviteMemberToTenant(tenantSlug, email, role);
      toast({
        title: t("members:inviteSent"),
        description: t("members:inviteSentSuccess", { email }),
      });
      setEmail("");
      setRole("member");
      onInviteSuccess();
      onClose();
    } catch (error) {
      toast({
        title: t("members:inviteError"),
        description: error?.message || t("members:unknownError"),
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("members:inviteMember")}</DialogTitle>
          <DialogDescription>{t("members:inviteMemberDesc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("members:emailAddress")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>{t("members:role")}</Label>
            <RadioGroup value={role} onValueChange={setRole}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="member" id="member" />
                <Label htmlFor="member" className="cursor-pointer">
                  {t("members:generalMember")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="owner" id="owner" />
                <Label htmlFor="owner" className="cursor-pointer">
                  {t("members:admin")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common:cancel")}
            </Button>
            <Button type="submit" disabled={isInviting}>
              {isInviting ? t("members:sendingInvite") : t("members:sendInvite")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
