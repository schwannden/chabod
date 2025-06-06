import { useState, useEffect } from "react";

const ALPHA_WARNING_DISMISSED_KEY = "chabod-alpha-warning-dismissed";

export function useAlphaWarning() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the warning has been dismissed before
    const isDismissed = localStorage.getItem(ALPHA_WARNING_DISMISSED_KEY) === "true";

    if (!isDismissed) {
      setIsOpen(true);
    }
  }, []);

  const dismissWarning = (dontShowAgain: boolean = false) => {
    setIsOpen(false);

    if (dontShowAgain) {
      localStorage.setItem(ALPHA_WARNING_DISMISSED_KEY, "true");
    }
  };

  const resetWarning = () => {
    localStorage.removeItem(ALPHA_WARNING_DISMISSED_KEY);
    setIsOpen(true);
  };

  return {
    isOpen,
    dismissWarning,
    resetWarning,
  };
}
