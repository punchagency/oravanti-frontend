import {
  dayjs,
  formatDate as formatDateUtil,
  guessTimezone,
  isToday,
  isYesterday,
} from "@/utils/date";

// Timeline rows are dense and grouped by day, so time is shown compactly in the
// viewer's local zone without a per-row zone label.
export function formatTime(iso: string): string {
  return dayjs.utc(iso).tz(guessTimezone()).format("h:mm A");
}

export function formatDate(iso: string): string {
  return formatDateUtil(iso);
}

export function dateLabel(dateStr: string, iso?: string): string {
  if (!iso) return dateStr;
  if (isToday(iso)) return "Today";
  if (isYesterday(iso)) return "Yesterday";
  return formatDate(iso);
}
