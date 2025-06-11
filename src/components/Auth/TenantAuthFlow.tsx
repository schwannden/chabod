import { useTenantAuthFlow, AuthFlowStep } from "@/hooks/useTenantAuthFlow";
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
  initialStep?: AuthFlowStep;
  prefilledEmail?: string;
  onFlowChange?: (step: AuthFlowStep, email?: string) => void;
}

export function TenantAuthFlow({
  tenantSlug,
  tenantName,
  inviteToken,
  onSuccess,
  initialStep = "welcome",
  prefilledEmail,
  onFlowChange,
}: TenantAuthFlowProps) {
  const { currentStep, detectedEmail, isLoading, error, setStep, checkEmailExists, reset } =
    useTenantAuthFlow(initialStep, prefilledEmail);

  const handleStepChange = (step: AuthFlowStep, email?: string) => {
    setStep(step);
    if (onFlowChange) {
      onFlowChange(step, email);
    }
  };

  const handleReset = () => {
    reset();
    if (onFlowChange) {
      onFlowChange("welcome");
    }
  };

  const handleEmailCheck = async (email: string) => {
    const emailExists = await checkEmailExists(email);

    const nextStep = emailExists ? "join-signin" : "signup";
    handleStepChange(nextStep, email);
  };

  switch (currentStep) {
    case "welcome":
      return (
        <TenantWelcomeScreen
          tenantName={tenantName}
          inviteToken={inviteToken}
          onNewUser={() => handleStepChange("signup")}
          onExistingUser={() => handleStepChange("email-detection")}
          onMemberSignIn={() => handleStepChange("signin")}
        />
      );

    case "email-detection":
      return (
        <EmailDetectionForm
          tenantName={tenantName}
          onBack={handleReset}
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
          onBack={handleReset}
          onSuccess={onSuccess}
          prefilledEmail={detectedEmail || prefilledEmail || undefined}
          onSwitchToSignIn={(email: string) => handleStepChange("join-signin", email)}
        />
      );

    case "join-signin":
      return (
        <JoinTenantSignInForm
          tenantName={tenantName}
          tenantSlug={tenantSlug}
          inviteToken={inviteToken}
          onBack={handleReset}
          onSuccess={onSuccess}
          prefilledEmail={detectedEmail || prefilledEmail || undefined}
        />
      );

    case "signin":
      return (
        <MemberSignInForm tenantName={tenantName} onBack={handleReset} onSuccess={onSuccess} />
      );

    default:
      return null;
  }
}
