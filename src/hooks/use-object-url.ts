import { useEffect, useState } from "react";

/**
 * A URL for these bytes, revoked when they change or the viewer goes away.
 *
 * Two components render a PDF from a cached blob — a matter's filled form, and
 * the CRM's blank-with-its-mapping — and both need this. It is a file of its
 * own rather than an export from either because a component file that also
 * exports a hook breaks fast refresh (`react-refresh/only-export-components`),
 * the same split `use-paged-list.ts` makes.
 *
 * ─── Why the bytes are cached and the URL is not ────────────────────────────
 *
 * An object URL is a live handle into this tab's memory. It has to be revoked
 * when its viewer goes away, or every form opened leaks a megabyte for the life
 * of the tab — and a revoked URL sitting in a query cache would hand the next
 * reader a blank frame. So the query holds the blob and this makes the URL.
 *
 * ─── Why the state is set from an effect ────────────────────────────────────
 *
 * `react-hooks/set-state-in-effect` warns about it, and it is nonetheless the
 * right shape. The obvious alternative — `useMemo` to create the URL and an
 * effect only to revoke it — is broken under StrictMode, which this app runs
 * in: the development double-mount runs the cleanup, revoking the URL, and the
 * memo does not re-run to replace it, so the viewer is handed a dead handle and
 * shows a blank frame. Creating *and* revoking in the same effect is what
 * survives that, because the second mount makes a fresh URL.
 */
export function useObjectUrl(blob: Blob | undefined) {
  const [url, setUrl] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- see the note above */
  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return url;
}
