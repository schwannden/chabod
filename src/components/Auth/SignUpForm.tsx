
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { associateUserWithTenant } from "@/lib/tenant-utils";
import { Checkbox } from "@/components/ui/checkbox";

interface SignUpFormProps {
  tenantSlug?: string;
  tenantName?: string;
  inviteToken?: string;
  onSuccess?: () => void;
  onSignInClick: () => void;
}

// Apostle's Creed as terms of service (required to check to sign up)
const termsOfServiceText = `
我信上帝，全能的父，創造天地的主；
我信我主耶穌基督，上帝的獨生子；
因聖靈感孕，為童貞女馬利亞所生；
在本丟彼拉多手下受難，被釘於十字架，受死，埋葬；
降在陰間，第三天從死裡復活；
升天，坐在全能父上帝的右邊；
將來必從那裡降臨，審判活人死人。
我信聖靈，我信聖而公之教會；
我信聖徒相通；我信罪得赦免；
我信身體復活；我信永生。阿們。
`;

export function SignUpForm({ 
  tenantSlug, 
  tenantName, 
  inviteToken, 
  onSuccess, 
  onSignInClick 
}: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast({
        title: "請同意信仰告白",
        description: "您必須同意信仰告白才能註冊帳號。",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);

    try {
      // First, try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // If user exists, proceed with tenant association
      if (!signInError && signInData.user) {
        if (tenantSlug) {
          try {
            await associateUserWithTenant(signInData.user.id, tenantSlug, inviteToken);
            toast({
              title: "Account linked with tenant",
              description: `Your existing account has been associated with ${tenantSlug}.`,
            });
          } catch (associateError: any) {
            // Sign out user if tenant association fails
            await supabase.auth.signOut();
            throw new Error(`Failed to associate account with tenant: ${associateError.message}`);
          }
        }

        if (onSuccess) {
          onSuccess();
        }
        return;
      }

      // User doesn't exist, sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw error;
      }

      // Associate new user with tenant if applicable
      if (tenantSlug && data.user) {
        try {
          await associateUserWithTenant(data.user.id, tenantSlug, inviteToken);
        } catch (associateError: any) {
          // Sign out user if tenant association fails
          await supabase.auth.signOut();
          throw new Error(`Failed to associate account with tenant: ${associateError.message}`);
        }
      }

      toast({
        title: "Account created!",
        description: tenantSlug 
          ? `Your account has been created and associated with ${tenantSlug}.` 
          : "Check your email for the confirmation link.",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>建立帳號</CardTitle>
        <CardDescription>
          {tenantName 
            ? `註冊加入 ${tenantName}` 
            : "註冊 Chabod 教會管理系統帳號"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full-name">姓名</Label>
            <Input
              id="full-name"
              placeholder="輸入您的姓名"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">電子郵件</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密碼</Label>
            <Input
              id="password"
              type="password"
              placeholder="設定密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          {/* Terms of Service section */}
          <div className="space-y-2">
            <Label>信仰告白（註冊需同意）</Label>
            <div className="max-h-40 overflow-y-auto bg-muted px-3 py-2 rounded border text-sm whitespace-pre-line">
              {termsOfServiceText}
            </div>
            <div className="flex items-start space-x-2 mt-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                required
                aria-required="true"
              />
              <Label htmlFor="terms" className="cursor-pointer select-none">
                我已閱讀並同意以上信仰告白
              </Label>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "建立帳號中..." : "建立帳號"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={onSignInClick}>
          已經有帳號？點此登入
        </Button>
      </CardFooter>
    </Card>
  );
}

