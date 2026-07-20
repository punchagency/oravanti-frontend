import {
  dayjs,
  formatDate as formatDateUtil,
  guessTimezone,
  isToday,
  isYesterday,
} from "@/utils/date";

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
