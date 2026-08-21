import { useEffect, useRef } from "react";

/**
 * Runs `reset` exactly when `open` flips to false → true.
 *
 * Dialog forms stay mounted after their first open (lazyMount without
 * unmountOnExit) so reopening is instant. The price is that stale input
 * would survive between opens — this edge-triggered hook restores the
 * "fresh form every open" behavior an unmount used to provide for free.
 *
 * `reset` should be memoized (useCallback) since it re-runs whenever it
 * changes identity while open.
 */
export function useResetOnOpen(open: boolean, reset: () => void) {
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && !wasOpen.current) {
      reset();
    }
    wasOpen.current = open;
  }, [open, reset]);
}
