import { useContext } from "react";
import { SessionContext } from "@/contexts/SessionContext";
import { SessionContextType } from "@/lib/types";

/**
 * Hook for accessing the authentication session context
 */
export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}