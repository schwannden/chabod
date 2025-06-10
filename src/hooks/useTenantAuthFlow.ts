import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AuthFlowStep = "welcome" | "email-detection" | "signup" | "signin" | "join-signin";

export interface TenantAuthFlowState {
  currentStep: AuthFlowStep;
  detectedEmail: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useTenantAuthFlow() {
  const [state, setState] = useState<TenantAuthFlowState>({
    currentStep: "welcome",
    detectedEmail: null,
    isLoading: false,
    error: null,
  });

  const setStep = (step: AuthFlowStep) => {
    setState((prev) => ({ ...prev, currentStep: step, error: null }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error, isLoading: false }));
  };

  const setLoading = (isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  };

  const checkEmailExists = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      // Try to sign in with a fake password to check if email exists
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: "fake-password-to-check-existence",
      });

      setState((prev) => ({ ...prev, detectedEmail: email, isLoading: false }));

      // If error is "Invalid login credentials", the email exists but password is wrong
      // If error is "Email not confirmed", the email exists
      if (
        error?.message.includes("Invalid login credentials") ||
        error?.message.includes("Email not confirmed")
      ) {
        return true;
      }

      // Other errors typically mean email doesn't exist
      return false;
    } catch {
      setError("Failed to check email. Please try again.");
      return false;
    }
  };

  const reset = () => {
    setState({
      currentStep: "welcome",
      detectedEmail: null,
      isLoading: false,
      error: null,
    });
  };

  return {
    ...state,
    setStep,
    setError,
    setLoading,
    checkEmailExists,
    reset,
  };
}
