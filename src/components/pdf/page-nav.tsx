import { Button, Flex, Text } from "@chakra-ui/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Turning the pages of a rendered PDF.
 *
 * ─── Why both tiers share this ──────────────────────────────────────────────
 *
 * The CRM's mapper and the matter's Forms tab render the same kind of thing —
 * one page of a government form on a canvas, with something drawn on top — and
 * they were going to grow the same toolbar twice. What differs between them is
 * only what the row *reports*: how much of the page is wired up, or how much of
 * it is filled in. That is `status`, on the end.
 *
 * ─── The page number is a readout, not a page picker ────────────────────────
 *
 * A 24-page form would be 24 buttons, and nobody navigates a USCIS filing by
 * page number: they step through it, or they arrive from a part. So this is
 * Previous / Next around a count. `PartSelect` is the picker, where a picker is
 * the right shape.
 */
export function PageNav({
  page,
  pageCount,
  onPage,
  status,
}: {
  /** Zero-based, matching the canvas. Displayed one-based. */
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
  /** What this page amounts to — pushed to the right end of the row. */
  status?: ReactNode;
}) {
  return (
    <Flex align="center" gap={2} pb={2} flexWrap="wrap">
      <Button
        variant="ghost"
        size="xs"
        h="28px"
        fontSize="12px"
        onClick={() => onPage(Math.max(page - 1, 0))}
        disabled={page === 0}
      >
        <ChevronLeft size={14} /> Previous
      </Button>
      <Text fontSize="12px" color="fg.muted" fontVariantNumeric="tabular-nums">
        Page {page + 1} of {pageCount}
      </Text>
      <Button
        variant="ghost"
        size="xs"
        h="28px"
        fontSize="12px"
        onClick={() => onPage(Math.min(page + 1, pageCount - 1))}
        disabled={page >= pageCount - 1}
      >
        Next <ChevronRight size={14} />
      </Button>

      {status && (
        <Flex ml="auto" align="center" minW={0}>
          {status}
        </Flex>
      )}
    </Flex>
  );
}
