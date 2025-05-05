import { createContext } from "react";
import { SessionContextType } from "@/lib/types";

export const SessionContext = createContext<SessionContextType>({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
});
