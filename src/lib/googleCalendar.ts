type CalendarTemplateParams = {
  title: string;
  start: Date;
  end: Date;
  isAllDay?: boolean;
  details?: string;
  location?: string;
  timezone?: string;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatGoogleDate(date: Date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}${m}${d}`;
}

function formatGoogleDateTimeLocal(date: Date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  const ss = pad2(date.getSeconds());
  return `${y}${m}${d}T${hh}${mm}${ss}`;
}

function parseTimeToParts(time: string) {
  const trimmed = time.trim();
  const [hStr, mStr, sStr] = trimmed.split(":");
  const hours = Number(hStr);
  const minutes = Number(mStr ?? "0");
  const seconds = Number(sStr ?? "0");
  if ([hours, minutes, seconds].some((n) => Number.isNaN(n))) return null;
  return { hours, minutes, seconds };
}

/**
 * Combine an ISO date string (yyyy-MM-dd) and a time string (HH:mm or HH:mm:ss)
 * into a Date object interpreted in local time.
 */
export function combineDateAndTimeLocal(dateStr: string, timeStr: string) {
  const [yStr, mStr, dStr] = dateStr.split("-");
  const year = Number(yStr);
  const monthIndex = Number(mStr) - 1;
  const day = Number(dStr);
  const parts = parseTimeToParts(timeStr);
  if ([year, monthIndex, day].some((n) => Number.isNaN(n)) || !parts) return null;
  return new Date(year, monthIndex, day, parts.hours, parts.minutes, parts.seconds, 0);
}

/**
 * Parse an ISO date string (yyyy-MM-dd) into a Date in local time at midnight.
 * Prefer this over `new Date(yyyy-MM-dd)` to avoid timezone shifting.
 */
export function parseISODateLocal(dateStr: string) {
  const [yStr, mStr, dStr] = dateStr.split("-");
  const year = Number(yStr);
  const monthIndex = Number(mStr) - 1;
  const day = Number(dStr);
  if ([year, monthIndex, day].some((n) => Number.isNaN(n))) return null;
  return new Date(year, monthIndex, day, 0, 0, 0, 0);
}

export function buildGoogleCalendarTemplateUrl(params: CalendarTemplateParams) {
  const timezone = params.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const isAllDay = !!params.isAllDay;

  const url = new URL("https://calendar.google.com/calendar/render");
  const search = url.searchParams;
  search.set("action", "TEMPLATE");
  search.set("text", params.title);

  if (isAllDay) {
    // Google Calendar expects all-day end date to be exclusive.
    const startDate = formatGoogleDate(params.start);
    const endExclusive = new Date(params.end);
    endExclusive.setDate(endExclusive.getDate() + 1);
    const endDate = formatGoogleDate(endExclusive);
    search.set("dates", `${startDate}/${endDate}`);
  } else {
    const start = formatGoogleDateTimeLocal(params.start);
    const end = formatGoogleDateTimeLocal(params.end);
    search.set("dates", `${start}/${end}`);
    if (timezone) search.set("ctz", timezone);
  }

  if (params.details) search.set("details", params.details);
  if (params.location) search.set("location", params.location);

  return url.toString();
}
