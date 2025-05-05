import { useState, useEffect } from "react";

/**
 * Returns the number of months to display based on window width.
 * 1 for <768px, 2 for >=768px, 3 for >=1024px
 */
export function useResponsiveMonths() {
  const [months, setMonths] = useState(1);

  useEffect(() => {
    function handler() {
      if (window.innerWidth >= 1024) setMonths(3);
      else if (window.innerWidth >= 768) setMonths(2);
      else setMonths(1);
    }
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return months;
}
