export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** "HH:MM:SS" (pg time) → "HH:MM" for <input type="time"> */
export function toFormTime(time: string): string {
  return time.slice(0, 5);
}

/** "HH:MM" or "HH:MM:SS" → "9:00 AM" */
export function formatTime(time: string): string {
  const [hourStr, minute] = time.split(":");
  const hour = Number(hourStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute} ${period}`;
}

/** "YYYY-MM-DD" → "Jul 20, 2026" (parsed as local date, no TZ shift) */
export function formatDisplayDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return formatDisplayDate(startDate);
  return `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;
}

export const TIME_OFF_TYPE_LABELS: Record<string, string> = {
  annual: "Annual",
  sick: "Sick",
  emergency: "Emergency",
  unpaid: "Unpaid",
};

export const TIME_OFF_STATUS_COLORS: Record<string, string> = {
  pending: "orange",
  approved: "green",
  rejected: "red",
};
