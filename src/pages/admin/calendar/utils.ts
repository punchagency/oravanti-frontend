import { dayjs } from "@/utils/date";
import type { CalendarViewType } from "./types";

export function getTitle(view: CalendarViewType, date: Date): string {
  const d = dayjs(date);
  if (view === "month") return d.format("MMMM YYYY");
  if (view === "week") {
    const start = d.startOf("week");
    const end = d.endOf("week");
    return `${start.format("MMM D")} – ${end.format("MMM D, YYYY")}`;
  }
  return d.format("dddd, MMMM D, YYYY");
}

export function getViewRange(view: CalendarViewType, date: Date) {
  const d = new Date(date);
  if (view === "month") {
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    start.setDate(start.getDate() - start.getDay());
    end.setDate(end.getDate() + (6 - end.getDay()));
    return { start, end };
  }
  if (view === "week") {
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

/** 30-minute time options — full 24-hour cycle from 12:00 AM to 11:30 PM */
export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const totalMinutes = i * 30; // start at 12:00 AM (0 min)
  const h24 = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const period = h24 >= 12 && h24 < 24 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return {
    label: `${h12}:${m.toString().padStart(2, "0")} ${period}`,
    value: `${h24.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
  };
});
