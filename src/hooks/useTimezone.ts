import { useAuthStore } from "@/store/auth-store";
import { guessTimezone, UTC } from "@/utils/date";

/**
 * The firm's IANA timezone (hydrated onto the session). Used for the "firm
 * time" shown alongside the viewer's local time at coordination surfaces, and
 * for interpreting admin-entered wall-clock times. Defaults to UTC.
 */
export function useFirmTimezone(): string {
  return useAuthStore((s) => s.firmTimezone) ?? UTC;
}

/**
 * The viewer's timezone for display: their stored preference when set,
 * otherwise the browser-detected zone.
 */
export function useViewerTimezone(): string {
  const userTz = useAuthStore((s) => s.user?.timezone);
  return userTz || guessTimezone();
}
