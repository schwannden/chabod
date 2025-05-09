import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { associateUserWithTenant } from "@/lib/membership-service";
import { checkUserTenantAccess } from "@/lib/member-service";
import { AuthEmailInput } from "./AuthEmailInput";
import { AuthPasswordInput } from "./AuthPasswordInput";

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
  onSignUpClick,
}: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetPasswordMode, setResetPasswordMode] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure email is trimmed before submitting
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast({
        title: "登入失敗",
        description: "電子郵件不能為空",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        let errorMessage = "電子郵件或密碼錯誤";
        if (error.message?.includes("invalid email")) {
          errorMessage = "電子郵件格式不正確";
        } else if (
          error.message?.toLowerCase().includes("invalid login credentials") ||
          error.message?.toLowerCase().includes("invalid email or password")
        ) {
          errorMessage = "電子郵件或密碼錯誤";
        } else if (error.message?.includes("User not confirmed")) {
          errorMessage = "請先驗證您的電子郵件";
        } else if (error.message) {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      if (tenantSlug && data.user) {
        if (inviteToken) {
          await associateUserWithTenant(data.user.id, tenantSlug, inviteToken);
        } else {
          const hasAccess = await checkUserTenantAccess(data.user.id, tenantSlug);

          if (!hasAccess) {
            await supabase.auth.signOut();
            throw new Error("您沒有權限進入此教會，請聯絡管理員或註冊新的帳號。");
          }
        }
      }

      toast({
        title: "登入成功",
        description: tenantName ? `歡迎回來，${tenantName}！` : "歡迎使用 Chabod！",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "登入失敗",
        description: error?.message || "電子郵件或密碼錯誤",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure email is trimmed before submitting
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      toast({
        title: "重設密碼失敗",
        description: "電子郵件不能為空",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: window.location.origin + "/auth",
      });

      if (error) {
        let errorMessage = "發送重設密碼電子郵件時發生錯誤";
        if (error.message?.includes("user not found")) {
          errorMessage = "查無此電子郵件";
        } else if (error.message?.includes("invalid email")) {
          errorMessage = "電子郵件格式不正確";
        } else if (error.message) {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      toast({
        title: "重設密碼郵件已發送",
        description: "請檢查您的電子郵件收件匣，點擊連結重設密碼。",
      });

      setResetPasswordMode(false);
    } catch (error) {
      const errorMessage = error?.message || "未知錯誤";
      toast({
        title: "重設密碼失敗",
        description: errorMessage || "發送重設密碼電子郵件時發生錯誤",
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
          <CardDescription>輸入您的電子郵件地址，我們將發送重設密碼的連結。</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <AuthEmailInput id="reset-email" value={email} onChange={setEmail} disabled={loading} />
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
          {tenantName ? `登入到 ${tenantName}` : "登入到 Chabod 教會管理系統"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-4">
          <AuthEmailInput value={email} onChange={setEmail} disabled={loading} />
          <AuthPasswordInput
            value={password}
            onChange={setPassword}
            required
            disabled={loading}
            showForgotPassword
            onForgotPassword={() => setResetPasswordMode(true)}
          />
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
