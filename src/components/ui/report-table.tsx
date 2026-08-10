import { Box, Table, type BoxProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

/** Vertical padding used on every report-table cell, for consistent row height. */
export const REPORT_CELL_PY = "14px";

/**
 * The shared AI-review table shell: a bordered, rounded card with a flush
 * shaded header. Used by the dashboard's recently-resolved table and the
 * by-document / resolution-log pages so they read as one system. Extra style
 * props (e.g. `mt`) pass through to the outer box.
 */
export function ReportTable({
  headers,
  children,
  flush = false,
  ...rest
}: {
  headers: string[];
  children: ReactNode;
  /**
   * Drop the table's own border and rounded corners.
   *
   * Standalone the table IS the card, so it draws its own frame. Inside a
   * `SurfaceCard` that frame is a second box drawn just inside the first, with
   * the card's 18px padding showing as a gap between them. Flush lets the
   * caller pull the table out to the card's edges instead.
   */
  flush?: boolean;
} & BoxProps) {
  return (
    <Box
      border={flush ? "none" : "1px solid"}
      borderColor="border"
      borderRadius={flush ? "0" : "10px"}
      overflow="hidden"
      {...rest}
    >
      <Box overflowX="auto">
        <Table.Root size="md">
          <Table.Header>
            <Table.Row bg="bg.muted">
              {headers.map((h) => (
                <Table.ColumnHeader
                  key={h}
                  py="12px"
                  fontSize="10px"
                  letterSpacing="0.06em"
                  color="fg.muted"
                  // A wrapped heading ("DUE / DATE") makes the column look
                  // narrower than it is and drags the row height with it. The
                  // wrapper scrolls horizontally instead.
                  whiteSpace="nowrap"
                >
                  {h.toUpperCase()}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>{children}</Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}

/** A body row with a divider and a hover highlight. */
export function ReportRow({ children }: { children: ReactNode }) {
  return (
    <Table.Row
      borderBottom="1px solid"
      borderColor="border.muted"
      _last={{ borderBottom: "none" }}
      transition="background 0.15s"
      _hover={{ bg: "bg.muted" }}
    >
      {children}
    </Table.Row>
  );
}
