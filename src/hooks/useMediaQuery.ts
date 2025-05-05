import { useEffect, useState } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // For SSR, we assume false initially
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia(query);

    // Initial check
    setMatches(media.matches);

    // Add listener for changes
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    media.addEventListener("change", listener);

    // Clean up
    return () => {
      media.removeEventListener("change", listener);
    };
  }, [query]);

  return matches;
}
