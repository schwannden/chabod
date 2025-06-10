
import { useTenantAuthFlow } from "@/hooks/useTenantAuthFlow";
import { TenantWelcomeScreen } from "./TenantWelcomeScreen";
import { EmailDetectionForm } from "./EmailDetectionForm";
import { JoinTenantSignUpForm } from "./JoinTenantSignUpForm";
import { JoinTenantSignInForm } from "./JoinTenantSignInForm";
import { MemberSignInForm } from "./MemberSignInForm";

interface TenantAuthFlowProps {
  tenantSlug: string;
  tenantName: string;
  inviteToken?: string;
  onSuccess: () => void;
}

export function TenantAuthFlow({
  tenantSlug,
  tenantName,
  inviteToken,
  onSuccess,
}: TenantAuthFlowProps) {
  const {
    currentStep,
    detectedEmail,
    isLoading,
    error,
    setStep,
    checkEmailExists,
    reset,
  } = useTenantAuthFlow();

  const handleEmailCheck = async (email: string) => {
    const emailExists = await checkEmailExists(email);
    
    if (emailExists) {
      setStep("join-signin");
    } else {
      setStep("signup");
    }
  };

  switch (currentStep) {
    case "welcome":
      return (
        <TenantWelcomeScreen
          tenantName={tenantName}
          inviteToken={inviteToken}
          onNewUser={() => setStep("signup")}
          onExistingUser={() => setStep("email-detection")}
          onMemberSignIn={() => setStep("signin")}
        />
      );

    case "email-detection":
      return (
        <EmailDetectionForm
          tenantName={tenantName}
          onBack={reset}
          onEmailChecked={handleEmailCheck}
          isLoading={isLoading}
          error={error}
        />
      );

    case "signup":
      return (
        <JoinTenantSignUpForm
          tenantName={tenantName}
          tenantSlug={tenantSlug}
          inviteToken={inviteToken}
          onBack={reset}
          onSuccess={onSuccess}
          prefilledEmail={detectedEmail || undefined}
        />
      );

    case "join-signin":
      return (
        <JoinTenantSignInForm
          tenantName={tenantName}
          tenantSlug={tenantSlug}
          inviteToken={inviteToken}
          onBack={reset}
          onSuccess={onSuccess}
          prefilledEmail={detectedEmail || undefined}
        />
      );

    case "signin":
      return (
        <MemberSignInForm
          tenantName={tenantName}
          onBack={reset}
          onSuccess={onSuccess}
        />
      );

    default:
      return null;
  }
}
