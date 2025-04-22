import * as React from "react";
import { format, startOfMonth, addMonths, isSameMonth } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Event, Group } from "@/lib/types";
import { useResponsiveMonths } from "./useResponsiveMonths";
import { EventCellTooltip } from "./EventCellTooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Utility: group events by date key
function getEventsByDate(events: (Event & { groups?: string[] })[]) {
  const byDate: Record<string, (Event & { groups?: string[] })[]> = {};
  events.forEach((event) => {
    if (!event.date) return;
    const key = format(new Date(event.date), "yyyy-MM-dd");
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(event);
  });
  return byDate;
}

// Format year-month to format: "2024年4月"
function formatYearMonth(date: Date) {
  return format(date, "yyyy年M月");
}

type EventCalendarProps = {
  // Must include possible groups property on event
  events: (Event & { groups?: string[] })[];
  groups: Group[];
};

export const EventCalendar: React.FC<EventCalendarProps> = ({ events, groups }) => {
  const monthsToShow = useResponsiveMonths();
  const today = new Date();
  const [baseMonth, setBaseMonth] = React.useState<Date>(startOfMonth(today));
  const eventsByDate = React.useMemo(() => getEventsByDate(events), [events]);
  const groupMap = React.useMemo(() => Object.fromEntries(groups.map(g => [g.id, g])) as Record<string, Group>, [groups]);

  // Navigation
  const handlePrev = () => setBaseMonth((m) => addMonths(m, -monthsToShow));
  const handleNext = () => setBaseMonth((m) => addMonths(m, monthsToShow));

  // Render each day cell with tooltip and popover if events exist
  const renderDay = (date: Date, monthDate: Date) => {
    const key = format(date, "yyyy-MM-dd");
    const todaysEvents = eventsByDate[key];
    const isCurrentMonth = isSameMonth(date, monthDate);

    // Only render events if this day belongs to the current month view
    const hasEvents = isCurrentMonth && todaysEvents && todaysEvents.length > 0;

    const eventContent = hasEvents && (
      <div>
        <div className="text-sm font-semibold mb-2">
          {format(date, "PPP")}
        </div>
        <div className="space-y-3">
          {todaysEvents.map(ev => (
            <div key={ev.id} className="border-b border-muted pb-1 last:border-0">
              <EventCellTooltip event={ev} groupMap={groupMap} />
            </div>
          ))}
        </div>
      </div>
    );

    const cell = (
      <button
        type="button"
        tabIndex={hasEvents ? 0 : -1}
        className={cn(
          "w-9 h-9 flex items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          hasEvents
            ? "bg-primary/20 text-primary font-semibold border border-primary/50 cursor-pointer"
            : isCurrentMonth 
              ? "hover:bg-muted" 
              : "text-muted-foreground/40 hover:bg-muted/50"
        )}
        aria-label={hasEvents ? `Events for ${format(date, "PPP")}` : undefined}
      >
        {date.getDate()}
      </button>
    );

    if (hasEvents) {
      return (
        <div key={key}>
          {/* Show on hover for desktop */}
          <Tooltip>
            <TooltipTrigger asChild>
              {/* Show on click for mobile */}
              <Popover>
                <PopoverTrigger asChild>
                  {cell}
                </PopoverTrigger>
                <PopoverContent>
                  {eventContent}
                </PopoverContent>
              </Popover>
            </TooltipTrigger>
            <TooltipContent>
              {eventContent}
            </TooltipContent>
          </Tooltip>
        </div>
      );
    }
    return cell;
  };

  const calendarClassNames = {
    day: "p-0",
    caption: "hidden",
    nav: "hidden",
    nav_button: "hidden",
    nav_button_next: "hidden",
    nav_button_previous: "hidden"
  };

  return (
    <TooltipProvider>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={handlePrev}
            className="rounded-full w-8 h-8 flex items-center justify-center border border-border hover:bg-muted"
            aria-label="Previous months"
            type="button"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="font-bold text-lg">
            {formatYearMonth(baseMonth)}
            {monthsToShow > 1 ? ` 共${monthsToShow}個月` : ""}
          </div>
          <button
            onClick={handleNext}
            className="rounded-full w-8 h-8 flex items-center justify-center border border-border hover:bg-muted"
            aria-label="Next months"
            type="button"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className={cn(
          "flex gap-4",
          monthsToShow === 1 ? "flex-col" : "flex-row"
        )}>
          {Array.from({ length: monthsToShow }).map((_, idx) => {
            const monthStart = addMonths(baseMonth, idx);
            return (
              <div className="flex-1" key={idx}>
                <div className="font-medium text-center text-base mb-2">
                  {formatYearMonth(monthStart)}
                </div>
                <Calendar
                  mode="single"
                  month={monthStart}
                  onMonthChange={() => {}}
                  selected={undefined}
                  onSelect={() => {}}
                  showOutsideDays
                  className={cn("p-3 pointer-events-auto")}
                  classNames={calendarClassNames}
                  components={{
                    Day: ({ date }) => renderDay(date, monthStart),
                  }}
                  fromDate={monthStart}
                  toDate={addMonths(monthStart, 1)}
                />
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};
