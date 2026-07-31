import { BrandButton, StatusPill } from "@/components/ui/intake-ui";
import { useResolutionLog } from "@/hooks/use-case-review";
import { Flex, Spinner, Table, Text } from "@chakra-ui/react";
import { useState } from "react";
import { ExportMenu } from "./export-menu";
import { REPORT_CELL_PY, ReportRow, ReportTable } from "@/components/ui/report-table";

/**
 * The dashboard's "Recently resolved" section, kept in its own component so
 * toggling it open/closed re-renders only this subtree — not the parent's
 * (potentially long) list of issue cards, which made the click feel laggy.
 *
 * The count comes from the dashboard's stats (already loaded); the list itself
 * is fetched lazily on first open so the spinner maps to the click.
 */
export function RecentlyResolved({ count }: { count: number }) {
  const [open, setOpen] = useState(false);
  const query = useResolutionLog({ limit: 20 }, open);

  return (
    <>
      <Flex mt="28px" justifyContent="space-between" alignItems="center">
        <Text fontSize="16px" fontWeight="600" color="fg">
          Recently resolved (last 30 days)
        </Text>
        <Flex gap="8px">
          {open && <ExportMenu report="resolution-log" label="Export" />}
          <BrandButton
            loading={open && query.isFetching}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide resolved" : `Show resolved (${count})`}
          </BrandButton>
        </Flex>
      </Flex>

      {open &&
        (query.isPending ? (
          <Flex mt="14px" py="40px" justify="center">
            <Spinner size="md" color="brand.solid" />
          </Flex>
        ) : (
          <ReportTable
            mt="14px"
            headers={[
              "Issue",
              "Case",
              "Resolved by",
              "Resolved date",
              "Action taken",
            ]}
          >
            {query.data?.data.map((row) => (
              <ReportRow key={row.id}>
                <Table.Cell py={REPORT_CELL_PY} fontWeight="500">
                  {row.title}
                </Table.Cell>
                <Table.Cell py={REPORT_CELL_PY}>
                  <Text fontWeight="500">
                    {row.client?.name ?? row.scenario.reference ?? "—"}
                  </Text>
                  {row.scenario.reference && row.client && (
                    <Text fontSize="11px" color="fg.muted" fontFamily="mono">
                      {row.scenario.reference}
                    </Text>
                  )}
                </Table.Cell>
                <Table.Cell py={REPORT_CELL_PY}>
                  {row.resolvedBy?.name ?? "—"}
                </Table.Cell>
                <Table.Cell py={REPORT_CELL_PY} color="fg.muted">
                  {row.resolvedAt
                    ? new Date(row.resolvedAt).toLocaleDateString()
                    : "—"}
                </Table.Cell>
                <Table.Cell py={REPORT_CELL_PY}>
                  {row.actionTaken ? (
                    <StatusPill tone="success">{row.actionTaken}</StatusPill>
                  ) : (
                    "—"
                  )}
                </Table.Cell>
              </ReportRow>
            ))}
          </ReportTable>
        ))}
    </>
  );
}
