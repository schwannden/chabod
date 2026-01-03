import { useMemo } from "react";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { buildGoogleCalendarTemplateUrl } from "@/lib/googleCalendar";

type AddToGoogleCalendarLinkProps = {
  title: string;
  start: Date;
  end: Date;
  isAllDay?: boolean;
  details?: string;
  location?: string;
  className?: string;
  label: string;
  showLabel?: boolean;
};

export function AddToGoogleCalendarLink({
  title,
  start,
  end,
  isAllDay,
  details,
  location,
  className,
  label,
  showLabel,
}: AddToGoogleCalendarLinkProps) {
  const isMobile = useIsMobile();
  const effectiveShowLabel = showLabel ?? !isMobile;

  const href = useMemo(
    () =>
      buildGoogleCalendarTemplateUrl({
        title,
        start,
        end,
        isAllDay,
        details,
        location,
      }),
    [title, start, end, isAllDay, details, location],
  );

  // Desktop: open in new tab. Mobile: allow universal link to hand off to app.
  const target = isMobile ? undefined : "_blank";
  const rel = target ? "noopener noreferrer" : undefined;

  return (
    <Button asChild variant="link" className={className}>
      <a href={href} target={target} rel={rel} aria-label={label}>
        <CalendarPlus className="h-4 w-4" />
        {effectiveShowLabel ? <span>{label}</span> : null}
      </a>
    </Button>
  );
}
