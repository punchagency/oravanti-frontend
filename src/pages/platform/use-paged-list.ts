import { useEffect, useState } from "react";

/**
 * Page state for one list, and the search that resets it.
 *
 * ─── Why every list in the CRM has this ─────────────────────────────────────
 *
 * The taxonomy is 8 practice areas, 57 subcategories and 687 case types.
 * Nothing here can afford to fetch a whole level, so the API pages every list
 * and every screen needs the same three pieces of state. Holding them in one
 * hook is what keeps five list pages from each inventing their own — and, in
 * particular, from each forgetting the same thing.
 *
 * That thing is the reset: typing a search while on page 4 asks the server for
 * the fourth page of a result set that now has one, and the screen goes blank
 * with no error to explain it. `setSearch` and `setLimit` both return to page
 * 1 for that reason.
 *
 * Apart from `paged.tsx` so that file exports components only and Vite's fast
 * refresh keeps working on it — the same split `nav-context.tsx` and
 * `use-nav.ts` make.
 */
export function usePagedList(initialLimit = 25) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [search, setSearchValue] = useState("");

  /*
    Debounced, because this drives a query key: a keystroke otherwise fetches,
    and "Adjustment" is ten requests of which nine are thrown away.
  */
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  return {
    page,
    limit,
    search,
    /** What to send: the settled term, not the one mid-keystroke. */
    params: { page, limit, search: debounced || undefined },
    setPage,
    setLimit: (next: number) => {
      setLimit(next);
      setPage(1);
    },
    setSearch: (next: string) => {
      setSearchValue(next);
      setPage(1);
    },
  };
}

export type PagedList = ReturnType<typeof usePagedList>;
