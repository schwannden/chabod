
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { associateUserWithTenant } from "@/lib/tenant-utils";

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
  onSignInClick 
}: SignUpFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
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
