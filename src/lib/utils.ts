import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Simple utility to confirm an action with a standard message
 * @param message - The confirmation message to display
 * @returns boolean - True if confirmed, false otherwise
 */
export function confirmAction(message: string = "確定要執行此操作嗎？"): boolean {
  return window.confirm(message);
}

/**
 * Format a date to a localized string with the specified options
 * @param date - The date to format
 * @param options - The Intl.DateTimeFormatOptions to use
 * @returns string - The formatted date
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  },
): string {
  if (!date) return "";
  const dateObj = typeof date === "object" ? date : new Date(date);

  try {
    return new Intl.DateTimeFormat("zh-TW", options).format(dateObj);
  } catch (err) {
    console.error("Error formatting date:", err);
    return String(date);
  }
}

/**
 * Get display name for a user - returns full name if available, email otherwise
 * @param profile - The user profile object containing name and email
 * @returns string - The display name
 */
export function getUserDisplayName(profile: {
  full_name?: string | null;
  email?: string | null;
}): string {
  if (profile?.full_name) return profile.full_name;
  if (profile?.email) return profile.email;
  return "未知用戶";
}
