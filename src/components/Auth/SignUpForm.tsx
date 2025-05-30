import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { associateUserWithTenant } from "@/lib/tenant-utils";
import { AuthEmailInput } from "./AuthEmailInput";
import { AuthPasswordInput } from "./AuthPasswordInput";
import { TermsOfService } from "./TermsOfService";

interface SignUpFormProps {
  tenantSlug?: string;
  tenantName?: string;
  inviteToken?: string;
  onSuccess?: () => void;
  onSignInClick: () => void;
}

export function SignUpForm({
  tenantSlug,
  tenantName,
  inviteToken,
  onSuccess,
  onSignInClick,
}: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
  };

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

    // Trim the full name before submitting
    const trimmedFullName = fullName.trim();

    if (!trimmedFullName) {
      toast({
        title: "姓名不能為空",
        description: "請輸入您的姓名",
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
              title: "帳號已與教會關聯",
              description: `您的帳號已成功加入 ${tenantSlug}。`,
            });
          } catch (associateError) {
            // Sign out user if tenant association fails
            await supabase.auth.signOut();
            const errorMessage = associateError?.message || "未知錯誤";
            throw new Error(`無法將帳號加入教會：${errorMessage}`);
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
            full_name: trimmedFullName,
          },
        },
      });

      if (error) {
        // Translate common Supabase error codes to Chinese
        let errorMessage = "發生未知錯誤";
        if (error.message?.includes("invalid email")) {
          errorMessage = "電子郵件格式不正確";
        } else if (error.message?.includes("password")) {
          errorMessage = "密碼需至少 6 個字元";
        } else if (error.message?.includes("User already registered")) {
          errorMessage = "此電子郵件已經註冊";
        } else if (error.message) {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      // Associate new user with tenant if applicable
      if (tenantSlug && data.user) {
        try {
          await associateUserWithTenant(data.user.id, tenantSlug, inviteToken);
        } catch (associateError) {
          // Sign out user if tenant association fails
          await supabase.auth.signOut();
          throw new Error(`無法將帳號加入教會：${associateError}`);
        }
      }

      toast({
        title: "帳號建立成功！",
        description: tenantSlug
          ? `您的帳號已建立並加入 ${tenantSlug}。`
          : "請前往電子郵件收信並點擊確認連結。",
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "建立帳號失敗",
        description: error?.message || "發生未知錯誤",
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
          {tenantName ? `註冊加入 ${tenantName}` : "註冊 Chabod 教會管理系統帳號"}
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
              onChange={handleFullNameChange}
              required
            />
          </div>
          <AuthEmailInput value={email} onChange={setEmail} disabled={loading} />
          <AuthPasswordInput value={password} onChange={setPassword} required disabled={loading} />
          <TermsOfService accepted={termsAccepted} onChange={setTermsAccepted} />
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
