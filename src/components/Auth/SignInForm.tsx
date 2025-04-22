
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { associateUserWithTenant } from "@/lib/membership-service";
import { checkUserTenantAccess } from "@/lib/member-service";

interface SignInFormProps {
  tenantSlug?: string; 
  tenantName?: string; 
  inviteToken?: string;
  onSuccess?: () => void;
  onSignUpClick: () => void;
}

export function SignInForm({ 
  tenantSlug, 
  tenantName, 
  inviteToken, 
  onSuccess, 
  onSignUpClick 
}: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (tenantSlug && data.user) {
        try {
          if (inviteToken) {
            await associateUserWithTenant(data.user.id, tenantSlug, inviteToken);
          } else {
            const hasAccess = await checkUserTenantAccess(data.user.id, tenantSlug);
            
            if (!hasAccess) {
              await supabase.auth.signOut();
              throw new Error("You don't have access to this tenant. Please contact the administrator or sign up for access.");
            }
          }
        } catch (membershipError: any) {
          await supabase.auth.signOut();
          throw membershipError;
        }
      }

      toast({
        title: "Signed in successfully",
        description: tenantName 
          ? `Welcome back to ${tenantName}!` 
          : "Welcome to Chabod!",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Invalid email or password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth',
      });

      if (error) {
        throw error;
      }

      toast({
        title: "重設密碼電子郵件已發送",
        description: "請檢查您的電子郵件以重設密碼。",
      });
      
      setResetPasswordMode(false);
    } catch (error: any) {
      toast({
        title: "重設密碼失敗",
        description: error.message || "發送重設密碼電子郵件時發生錯誤",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (resetPasswordMode) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>重設密碼</CardTitle>
          <CardDescription>
            輸入您的電子郵件地址，我們將發送重設密碼的連結。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">電子郵件</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "發送中..." : "發送重設密碼連結"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={() => setResetPasswordMode(false)}>
            返回登入
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>登入</CardTitle>
        <CardDescription>
          {tenantName 
            ? `登入到 ${tenantName}` 
            : "登入到 Chabod 教會管理系統"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-4">
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
            <div className="flex justify-between items-center">
              <Label htmlFor="password">密碼</Label>
              <Button 
                variant="link" 
                className="px-0"
                type="button"
                onClick={() => setResetPasswordMode(true)}
              >
                忘記密碼？
              </Button>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="輸入密碼"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登入中..." : "登入"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="link" onClick={onSignUpClick}>
          還沒有帳號？點此註冊
        </Button>
      </CardFooter>
    </Card>
  );
}
