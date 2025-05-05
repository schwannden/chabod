import * as React from "react";
import { format, startOfMonth, addMonths, isSameMonth } from "date-fns";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useResponsiveMonths } from "@/hooks/useResponsiveMonths";

// Format year-month to format: "2024年4月"
function formatYearMonth(date: Date) {
  return format(date, "yyyy年M月");
}

// Base event interface with minimal required properties
export interface BaseEvent {
  id: string;
  date: string;
}

type GenericCalendarProps = {
  events: BaseEvent[];
  isLoading?: boolean;
  renderTooltip: (event: BaseEvent) => React.ReactNode;
  getDateKey?: (event: BaseEvent) => string;
};

export function GenericCalendar({
  events,
  isLoading = false,
  renderTooltip,
  getDateKey = (event) => event.date,
}: GenericCalendarProps) {
  const monthsToShow = useResponsiveMonths();
  const today = new Date();
  const [baseMonth, setBaseMonth] = React.useState<Date>(startOfMonth(today));

  // Group events by date
  const eventsByDate = React.useMemo(() => {
    const byDate: Record<string, BaseEvent[]> = {};
    events.forEach((event) => {
      if (!event.date) return;

      try {
        const key = getDateKey(event);
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push(event);
      } catch (error) {
        console.warn(`Error processing event date: ${event.date}`, error);
      }
    });
    return byDate;
  }, [events, getDateKey]);

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = React.useState<BaseEvent[]>([]);

  // Navigation
  const handlePrev = () => setBaseMonth((m) => addMonths(m, -monthsToShow));
  const handleNext = () => setBaseMonth((m) => addMonths(m, monthsToShow));

  // Event handlers for day click
  const handleDayClick = (date: Date) => {
    if (!date || isNaN(date.getTime())) return;

    const dateKey = format(date, "yyyy-MM-dd");
    const selectedDateEvents = eventsByDate[dateKey];
    const hasEvents = selectedDateEvents && selectedDateEvents.length > 0;

    if (hasEvents) {
      setSelectedEvents(selectedDateEvents);
      setSelectedDate(dateKey);
      setIsDialogOpen(true);
    }
  };

  // This modifies the day component rendering behavior
  const modifiers = React.useMemo(() => {
    // Create an array of dates with events for each month
    const months: Record<number, Date[]> = {};

    // Add all dates with events to the appropriate month
    Object.keys(eventsByDate).forEach((dateKey) => {
      if (eventsByDate[dateKey] && eventsByDate[dateKey].length > 0) {
        const date = new Date(dateKey);
        if (!isNaN(date.getTime())) {
          // For each month in the view, only include dates that belong to that month
          for (let i = 0; i < monthsToShow; i++) {
            const currentMonth = addMonths(baseMonth, i);
            if (isSameMonth(date, currentMonth)) {
              if (!months[i]) months[i] = [];
              months[i].push(date);
            }
          }
        }
      }
    });

    // Return an object with a hasEvents array for each month
    return Object.fromEntries(
      Object.entries(months).map(([index, dates]) => [`hasEvents-${index}`, dates]),
    );
  }, [eventsByDate, baseMonth, monthsToShow]);

  // Custom styling for days with events
  const modifiersStyles = {
    hasEvents: {
      backgroundColor: "hsl(var(--primary) / 0.2)",
      color: "hsl(var(--primary))",
      fontWeight: "bold",
      border: "1px solid hsl(var(--primary) / 0.5)",
      cursor: "pointer",
    },
  };

  const calendarClassNames = {
    day: "p-2",
    caption: "hidden",
    caption_label: "hidden",
    nav: "hidden",
  };

  if (isLoading) {
    return (
      <div className="mb-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-8" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
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
      <div className={cn("flex gap-4", monthsToShow === 1 ? "flex-col" : "flex-row")}>
        {Array.from({ length: monthsToShow }).map((_, idx) => {
          const monthStart = addMonths(baseMonth, idx);
          return (
            <div className="flex-1" key={idx}>
              <div className="font-medium text-center text-base mb-2">
                {formatYearMonth(monthStart)}
              </div>
              <Calendar
                showOutsideDays={false}
                month={monthStart}
                onDayClick={handleDayClick}
                classNames={calendarClassNames}
                modifiers={{
                  hasEvents: modifiers[`hasEvents-${idx}`] || [],
                }}
                modifiersStyles={modifiersStyles}
              />
            </div>
          );
        })}
      </div>

      {/* Dialog for showing events */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedDate && format(new Date(selectedDate), "PPP")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {selectedEvents.map((event) => (
              <div key={event.id} className="border-b border-muted pb-2 last:border-0">
                {renderTooltip(event)}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
