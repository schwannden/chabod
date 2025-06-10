/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderHook, act } from "@testing-library/react";
import { useTenantAuthFlow } from "@/hooks/useTenantAuthFlow";

// Mock the Supabase module before importing the hook
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
    },
  },
}));

// Import the mocked client to get access to the mock
import { supabase } from "@/integrations/supabase/client";
const mockedSignInWithPassword = supabase.auth.signInWithPassword as jest.MockedFunction<
  typeof supabase.auth.signInWithPassword
>;

describe("useTenantAuthFlow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with welcome step and default values", () => {
      const { result } = renderHook(() => useTenantAuthFlow());

      expect(result.current.currentStep).toBe("welcome");
      expect(result.current.detectedEmail).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("Step Management", () => {
    it("should change step and clear error when setStep is called", () => {
      const { result } = renderHook(() => useTenantAuthFlow());

      // Set an error first
      act(() => {
        result.current.setError("Some error");
      });

      expect(result.current.error).toBe("Some error");

      // Change step should clear error
      act(() => {
        result.current.setStep("email-detection");
      });

      expect(result.current.currentStep).toBe("email-detection");
      expect(result.current.error).toBeNull();
    });

    it("should reset to initial state", () => {
      const { result } = renderHook(() => useTenantAuthFlow());

      // Change some state
      act(() => {
        result.current.setStep("signup");
        result.current.setError("Some error");
      });

      expect(result.current.currentStep).toBe("signup");
      expect(result.current.error).toBe("Some error");

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.currentStep).toBe("welcome");
      expect(result.current.detectedEmail).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("Error Handling", () => {
    it("should set error and stop loading", () => {
      const { result } = renderHook(() => useTenantAuthFlow());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setError("Test error");
      });

      expect(result.current.error).toBe("Test error");
      expect(result.current.isLoading).toBe(false);
    });

    it("should clear error by setting null", () => {
      const { result } = renderHook(() => useTenantAuthFlow());

      act(() => {
        result.current.setError("Test error");
      });

      expect(result.current.error).toBe("Test error");

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("Loading State", () => {
    it("should manage loading state", () => {
      const { result } = renderHook(() => useTenantAuthFlow());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("Email Existence Check", () => {
    it("should return true when email exists (invalid credentials error)", async () => {
      mockedSignInWithPassword.mockResolvedValueOnce({
        error: { message: "Invalid login credentials" } as any,
        data: { user: null, session: null },
      } as any);

      const { result } = renderHook(() => useTenantAuthFlow());

      let emailExists;
      await act(async () => {
        emailExists = await result.current.checkEmailExists("test@example.com");
      });

      expect(emailExists).toBe(true);
      expect(result.current.detectedEmail).toBe("test@example.com");
      expect(result.current.isLoading).toBe(false);
      expect(mockedSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "fake-password-to-check-existence",
      });
    });

    it("should return true when email exists (email not confirmed error)", async () => {
      mockedSignInWithPassword.mockResolvedValueOnce({
        error: { message: "Email not confirmed" } as any,
        data: { user: null, session: null },
      } as any);

      const { result } = renderHook(() => useTenantAuthFlow());

      let emailExists;
      await act(async () => {
        emailExists = await result.current.checkEmailExists("unconfirmed@example.com");
      });

      expect(emailExists).toBe(true);
      expect(result.current.detectedEmail).toBe("unconfirmed@example.com");
      expect(result.current.isLoading).toBe(false);
    });

    it("should return false when email doesn't exist", async () => {
      mockedSignInWithPassword.mockResolvedValueOnce({
        error: { message: "User not found" } as any,
        data: { user: null, session: null },
      } as any);

      const { result } = renderHook(() => useTenantAuthFlow());

      let emailExists;
      await act(async () => {
        emailExists = await result.current.checkEmailExists("nonexistent@example.com");
      });

      expect(emailExists).toBe(false);
      expect(result.current.detectedEmail).toBe("nonexistent@example.com");
      expect(result.current.isLoading).toBe(false);
    });

    it("should return false when no error (successful login)", async () => {
      mockedSignInWithPassword.mockResolvedValueOnce({
        error: null,
        data: { user: { id: "test-user-id" } as any, session: null },
      } as any);

      const { result } = renderHook(() => useTenantAuthFlow());

      let emailExists;
      await act(async () => {
        emailExists = await result.current.checkEmailExists("valid@example.com");
      });

      expect(emailExists).toBe(false);
      expect(result.current.detectedEmail).toBe("valid@example.com");
      expect(result.current.isLoading).toBe(false);
    });

    it("should handle exceptions during email check", async () => {
      mockedSignInWithPassword.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useTenantAuthFlow());

      let emailExists;
      await act(async () => {
        emailExists = await result.current.checkEmailExists("error@example.com");
      });

      expect(emailExists).toBe(false);
      expect(result.current.error).toBe("Failed to check email. Please try again.");
      expect(result.current.isLoading).toBe(false);
    });

    it("should set loading state during email check", async () => {
      mockedSignInWithPassword.mockResolvedValueOnce({
        error: { message: "Invalid login credentials" } as any,
        data: { user: null, session: null },
      } as any);

      const { result } = renderHook(() => useTenantAuthFlow());

      // Initial state should not be loading
      expect(result.current.isLoading).toBe(false);

      // Perform email check
      await act(async () => {
        await result.current.checkEmailExists("test@example.com");
      });

      // After completion, loading should be false
      expect(result.current.isLoading).toBe(false);
      expect(result.current.detectedEmail).toBe("test@example.com");
      expect(result.current.error).toBeNull();
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete flow: email check -> step change", async () => {
      mockedSignInWithPassword.mockResolvedValueOnce({
        error: { message: "Invalid login credentials" } as any,
        data: { user: null, session: null },
      } as any);

      const { result } = renderHook(() => useTenantAuthFlow());

      // Start with welcome step
      expect(result.current.currentStep).toBe("welcome");

      // Move to email detection
      act(() => {
        result.current.setStep("email-detection");
      });

      expect(result.current.currentStep).toBe("email-detection");

      // Check email exists
      let emailExists;
      await act(async () => {
        emailExists = await result.current.checkEmailExists("existing@example.com");
      });

      expect(emailExists).toBe(true);
      expect(result.current.detectedEmail).toBe("existing@example.com");

      // Move to appropriate next step based on email existence
      act(() => {
        result.current.setStep(emailExists ? "join-signin" : "signup");
      });

      expect(result.current.currentStep).toBe("join-signin");
    });

    it("should handle error recovery", async () => {
      const { result } = renderHook(() => useTenantAuthFlow());

      // Set an error
      act(() => {
        result.current.setError("Connection failed");
      });

      expect(result.current.error).toBe("Connection failed");

      // Changing step should clear error
      act(() => {
        result.current.setStep("signup");
      });

      expect(result.current.error).toBeNull();
      expect(result.current.currentStep).toBe("signup");
    });
  });
});
