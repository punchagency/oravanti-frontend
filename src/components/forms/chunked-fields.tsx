import { useEffect, useState, type ReactNode } from "react";

import { Text } from "@chakra-ui/react";

/** How many rows to build in one frame. */
const CHUNK = 40;

/**
 * One part's rows, built a batch per frame.
 *
 * ─── Why a part is still too much for one frame ─────────────────────────────
 *
 * Reading a form a part at a time already keeps the mounted count off the
 * whole-form number — 96 fields rather than 512 on the I-485's biggest opening
 * part. But a part is not small either: Part 9 is 172 fields and 121 of them
 * are dropdowns or yes/no pairs, each a state machine with a trigger and a
 * positioner. Building all of them in one go is a frame the browser cannot
 * finish, and the part appears to hang for most of a second after it is chosen.
 *
 * So the rows arrive in `CHUNK`-sized batches, one per animation frame. The
 * first batch paints immediately and the rest follow, which is the difference
 * between a stall and a fill-in. Nothing else changes: every field still
 * mounts, binds to the same draft, and saves.
 *
 * `requestAnimationFrame` rather than a timeout because the point is to hand
 * the browser back a frame it can paint, and that is the beat rAF schedules
 * against.
 */
export function ChunkedFields<T>({
  fields,
  children,
}: {
  fields: T[];
  /**
   * The rows for the fields built so far. Called once per batch.
   *
   * A caller whose parent re-renders on something other than this list — a
   * search box's own keystrokes, say — should hold its rows in a `useMemo` and
   * return `rows.slice(0, built.length)` rather than mapping here. The batch is
   * always a prefix of `fields`, so the two line up; what it buys is that React
   * sees the same elements and skips them. See the wiring views.
   */
  children: (fields: T[]) => ReactNode;
}) {
  const [shown, setShown] = useState(CHUNK);

  // A different part — or the same part on a different form — starts over.
  // Adjusted during render off the changed prop rather than in an effect:
  // React's documented pattern, and it saves the extra pass an effect would
  // cost on every part change.
  const [builtFor, setBuiltFor] = useState(fields);
  if (builtFor !== fields) {
    setBuiltFor(fields);
    setShown(CHUNK);
  }

  useEffect(() => {
    if (shown >= fields.length) return;
    const frame = requestAnimationFrame(() => setShown((n) => n + CHUNK));
    return () => cancelAnimationFrame(frame);
  }, [shown, fields.length]);

  const remaining = fields.length - shown;

  return (
    <>
      {children(fields.slice(0, shown))}
      {remaining > 0 && (
        <Text fontSize="11px" color="fg.subtle" py={2}>
          Loading {remaining} more…
        </Text>
      )}
    </>
  );
}
