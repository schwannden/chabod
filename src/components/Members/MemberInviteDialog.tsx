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
import { inviteUserToTenant } from "@/lib/member-service";

interface MemberInviteDialogProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onMemberInvited: () => void;
}

export function MemberInviteDialog({
  tenantId,
  isOpen,
  onClose,
  onMemberInvited,
}: MemberInviteDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("一般會友");
  const [isInviting, setIsInviting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: "驗證錯誤",
        description: "電子郵件為必填",
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);

    try {
      await inviteUserToTenant(tenantId, email, role);
      toast({
        title: "邀請已傳送",
        description: `邀請已傳送至 ${email}。`,
      });
      onMemberInvited();
      onClose();
      setEmail("");
      setRole("一般會友");
    } catch (error) {
      toast({
        title: "傳送邀請時出錯",
        description: error?.message || "發生未知錯誤",
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
          <DialogTitle>邀請會友</DialogTitle>
          <DialogDescription>邀請新會友加入此教會。</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">電子郵件地址</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>角色</Label>
            <RadioGroup value={role} onValueChange={setRole} className="flex flex-col space-y-1">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="一般會友" id="一般會友" />
                <Label htmlFor="一般會友" className="cursor-pointer">
                  一般會友
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="管理者" id="管理者" />
                <Label htmlFor="管理者" className="cursor-pointer">
                  管理者
                </Label>
              </div>
            </RadioGroup>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={isInviting}>
              {isInviting ? "正在傳送邀請..." : "傳送邀請"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
