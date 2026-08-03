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
  ...rest
}: { headers: string[]; children: ReactNode } & BoxProps) {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
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
