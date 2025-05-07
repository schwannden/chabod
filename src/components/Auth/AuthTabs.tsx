import { useState } from "react";
import { SignInForm } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AuthTabsProps {
  tenantSlug?: string;
  tenantName?: string;
  inviteToken?: string;
  onSuccess?: () => void;
  initialTab?: "signin" | "signup";
}

export function AuthTabs({
  tenantSlug,
  tenantName,
  inviteToken,
  onSuccess,
  initialTab = "signin",
}: AuthTabsProps) {
  const [activeTab, setActiveTab] = useState<"signin" | "signup">(initialTab);

  const handleSignInClick = () => setActiveTab("signin");
  const handleSignUpClick = () => setActiveTab("signup");

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "signin" | "signup")}
      className="w-full max-w-md mx-auto"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">登入</TabsTrigger>
        <TabsTrigger value="signup">註冊</TabsTrigger>
      </TabsList>
      <TabsContent value="signin">
        <SignInForm
          tenantSlug={tenantSlug}
          tenantName={tenantName}
          inviteToken={inviteToken}
          onSuccess={onSuccess}
          onSignUpClick={handleSignUpClick}
        />
      </TabsContent>
      <TabsContent value="signup">
        <SignUpForm
          tenantSlug={tenantSlug}
          tenantName={tenantName}
          inviteToken={inviteToken}
          onSuccess={onSuccess}
          onSignInClick={handleSignInClick}
        />
      </TabsContent>
    </Tabs>
  );
}
