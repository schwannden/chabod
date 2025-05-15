
import { useToast as useShadcnToast, toast as shadcnToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";

// Export both toast implementations for backward compatibility
export const useToast = useShadcnToast;
export const toast = {
  ...shadcnToast,
  // Override with sonner toast for consistency
  success: sonnerToast.success,
  error: sonnerToast.error,
  info: sonnerToast.info,
  warning: sonnerToast.warning,
};
