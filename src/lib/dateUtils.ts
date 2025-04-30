import { format, parseISO } from "date-fns";

// Helper to format Date to 'yyyy-MM-dd' for input value
export const formatDateForInput = (date: Date | undefined): string => {
  if (!date) return "";
  try {
    return format(date, 'yyyy-MM-dd');
  } catch (error) {
    console.error("Error formatting date for input:", error);
    return "";
  }
};

// Helper to parse 'yyyy-MM-dd' string back to Date for form state
export const parseDateFromInput = (value: string): Date | undefined => {
  if (!value) return undefined;
  try {
    // Add time component to avoid timezone issues when creating Date object
    return parseISO(value + 'T00:00:00'); 
  } catch (error) {
    console.error("Error parsing date from input:", error);
    return undefined;
  }
}; 