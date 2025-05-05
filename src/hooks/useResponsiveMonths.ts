import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export function useResponsiveMonths(): number {
  const [monthsToShow, setMonthsToShow] = useState(1);
  const isLargeScreen = useMediaQuery("(min-width: 768px)");
  const isExtraLargeScreen = useMediaQuery("(min-width: 1280px)");

  useEffect(() => {
    if (isExtraLargeScreen) {
      setMonthsToShow(3);
    } else if (isLargeScreen) {
      setMonthsToShow(2);
    } else {
      setMonthsToShow(1);
    }
  }, [isLargeScreen, isExtraLargeScreen]);

  return monthsToShow;
}
