import { getStaffs } from "@/api/organization";
import type { StaffMemberDTO } from "@/hooks/use-staff-list";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

/** How many matches a picker panel shows before the searcher has to narrow. */
const STAFF_SEARCH_LIMIT = 20;

/**
 * Active staff matching `search`, fetched only once `enabled` flips true.
 *
 * Assignment pickers mount with every row of a task table but are opened for
 * at most one of them, so the roster stays unfetched until a panel is actually
 * opened. `search` is expected to arrive already debounced — the query key
 * includes it, so an undebounced value would fire a request per keystroke.
 */
export function useStaffSearch(search: string, enabled: boolean) {
  const term = search.trim();

  return useQuery({
    queryKey: ["staffSearch", term, STAFF_SEARCH_LIMIT],
    queryFn: () =>
      getStaffs({
        search: term || undefined,
        status: "active",
        limit: STAFF_SEARCH_LIMIT,
      }),
    enabled,
    // Keep the previous matches on screen while the next search resolves, so
    // the panel doesn't flash empty between keystrokes.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    select: (response): StaffMemberDTO[] => response.data,
  });
}

export function staffDisplayName(staff: {
  firstName: string;
  lastName: string;
}): string {
  return `${staff.firstName} ${staff.lastName}`.trim();
}
