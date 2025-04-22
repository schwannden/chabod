
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Profile } from "@/lib/types";
import { updateUserProfile } from "@/lib/profile-service";

interface ProfileFormProps {
  profile: Profile;
  onProfileUpdated: () => void;
}

export function ProfileForm({ profile, onProfileUpdated }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [firstName, setFirstName] = useState(profile.first_name || "");
  const [lastName, setLastName] = useState(profile.last_name || "");
  const [email] = useState(profile.email); // Email cannot be changed directly
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Update state when profile prop changes
  useEffect(() => {
    setFullName(profile.full_name || "");
    setFirstName(profile.first_name || "");
    setLastName(profile.last_name || "");
    setAvatarUrl(profile.avatar_url || "");
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await updateUserProfile(profile.id, {
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        avatar_url: avatarUrl,
      });

      toast({
        title: "個人資料已更新",
        description: "你的個人資料已成功更新。",
      });
      
      onProfileUpdated();
    } catch (error: any) {
      toast({
        title: "更新個人資料時出錯",
        description: error.message || "發生未知錯誤",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>你的個人資料</CardTitle>
        <CardDescription>
          更新你的個人資訊
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">全名</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="你的名字"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first-name">名字</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="名字"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last-name">姓氏</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="姓氏"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">電子郵件地址</Label>
            <Input
              id="email"
              value={email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              電子郵件無法更改。
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="avatar-url">頭像 URL</Label>
            <Input
              id="avatar-url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "儲存中..." : "儲存變更"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
