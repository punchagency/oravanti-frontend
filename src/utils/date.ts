import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import customParseFormat from "dayjs/plugin/customParseFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import { CalendarDate } from "@internationalized/date";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);

export { dayjs };
export type { Dayjs };

/**
 * Central datetime utility for the frontend. The three-layer model:
 *   - Storage/transport: UTC ISO-8601 strings (what the API sends/receives).
 *   - Business logic: computed server-side in the firm's timezone.
 *   - Presentation: localized to each viewer's own timezone by default, with the
 *     firm time shown alongside at coordination surfaces (appointments,
 *     meetings, hearings, deadlines).
 *
 * `tz` parameters are IANA identifiers (e.g. "America/New_York"). When omitted,
 * helpers use the viewer's own browser-detected zone.
 */

export const UTC = "UTC";

/** The viewer's browser-detected IANA timezone (fallback for display). */
export const guessTimezone = (): string => dayjs.tz.guess();

const resolveTz = (tz?: string): string => tz || guessTimezone();

/** Short timezone abbreviation for an instant in `tz` (e.g. "EST", "BST"). */
export const zoneAbbr = (iso: string | number | Date, tz?: string): string => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: resolveTz(tz),
    timeZoneName: "short",
  }).formatToParts(dayjs.utc(iso).toDate());
  return parts.find((p) => p.type === "timeZoneName")?.value ?? resolveTz(tz);
};

// ─── Presentation (viewer-local by default, always labeled) ───────────────────

const DATE_FMT = "MMM D, YYYY";
const TIME_FMT = "h:mm A";
const DATETIME_FMT = "MMM D, YYYY h:mm A";

/** Date only, in the viewer's zone (e.g. "Mar 4, 2026"). */
export const formatDate = (iso: string | number | Date, tz?: string): string =>
  dayjs.utc(iso).tz(resolveTz(tz)).format(DATE_FMT);

/** Time only, labeled with the zone (e.g. "3:00 PM EST"). */
export const formatTime = (iso: string | number | Date, tz?: string): string =>
  `${dayjs.utc(iso).tz(resolveTz(tz)).format(TIME_FMT)} ${zoneAbbr(iso, tz)}`;

/** Date + time, labeled with the zone (e.g. "Mar 4, 2026 3:00 PM EST"). */
export const formatDateTime = (
  iso: string | number | Date,
  tz?: string,
): string =>
  `${dayjs.utc(iso).tz(resolveTz(tz)).format(DATETIME_FMT)} ${zoneAbbr(iso, tz)}`;

/** Relative time from now (e.g. "3 days ago", "in 2 hours"). */
export const fromNow = (iso: string | number | Date): string =>
  dayjs.utc(iso).fromNow();

/** True when `iso` falls on today's date in `tz` (viewer zone by default). */
export const isToday = (iso: string | number | Date, tz?: string): boolean =>
  dayjs.utc(iso).tz(resolveTz(tz)).isSame(dayjs().tz(resolveTz(tz)), "day");

/** True when `iso` falls on yesterday's date in `tz`. */
export const isYesterday = (
  iso: string | number | Date,
  tz?: string,
): boolean =>
  dayjs
    .utc(iso)
    .tz(resolveTz(tz))
    .isSame(dayjs().tz(resolveTz(tz)).subtract(1, "day"), "day");

/**
 * Dual-zone rendering for coordination surfaces: the viewer's local time plus
 * the firm time, both labeled (e.g. "3:00 PM EST · 12:00 PM PST firm").
 * Collapses to a single value when the two zones resolve to the same offset.
 */
export const formatDualZone = (
  iso: string | number | Date,
  opts: { viewerTz?: string; firmTz: string; withDate?: boolean },
): string => {
  const viewerTz = resolveTz(opts.viewerTz);
  const fmt = opts.withDate ? DATETIME_FMT : TIME_FMT;
  const viewer = `${dayjs.utc(iso).tz(viewerTz).format(fmt)} ${zoneAbbr(iso, viewerTz)}`;
  const sameOffset =
    dayjs.utc(iso).tz(viewerTz).format("Z") ===
    dayjs.utc(iso).tz(opts.firmTz).format("Z");
  if (sameOffset) return viewer;
  const firm = `${dayjs.utc(iso).tz(opts.firmTz).format(fmt)} ${zoneAbbr(iso, opts.firmTz)}`;
  return `${viewer} · ${firm} firm`;
};

// ─── Input / boundary conversions ─────────────────────────────────────────────

/**
 * Interpret a wall-clock `dateStr` (`YYYY-MM-DD`) + `time` (`HH:MM`) as local
 * time in `tz` (typically the firm zone, since the admin types the firm's local
 * time) and return the corresponding UTC ISO string. Replaces the manual
 * `` new Date(`${date}T${time}:00Z`).toISOString() `` that pinned to UTC.
 */
export const wallClockToUtcIso = (
  dateStr: string,
  time: string,
  tz: string,
): string => {
  const normalized = time.length === 5 ? `${time}:00` : time;
  return dayjs.tz(`${dateStr}T${normalized}`, tz).utc().toISOString();
};

// ─── Chakra DatePicker (@internationalized/date) boundary ─────────────────────

/** Convert an ISO string (or `YYYY-MM-DD`) to a Chakra `CalendarDate`. */
export const isoToCalendarDate = (
  iso: string,
  tz?: string,
): CalendarDate => {
  const d = dayjs.utc(iso).tz(resolveTz(tz));
  return new CalendarDate(d.year(), d.month() + 1, d.date());
};

/** Convert a Chakra `CalendarDate` to a plain `YYYY-MM-DD` string. */
export const calendarDateToIso = (value: {
  year: number;
  month: number;
  day: number;
}): string =>
  `${value.year}-${String(value.month).padStart(2, "0")}-${String(
    value.day,
  ).padStart(2, "0")}`;
