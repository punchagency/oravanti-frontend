import type { TimeEntryRow, TimeEntryStatusFilter } from "@/api/finance";
import { FilterCombobox } from "@/components/ui/filter-combobox";
import { BrandButton, SurfaceCard } from "@/components/ui/intake-ui";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { StatTile } from "@/components/ui/stat-tile";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import {
  useApproveTimeEntry,
  useEarningsByStaff,
  useRejectTimeEntry,
  useTimeBillingStats,
  useTimeEntries,
  useTopMatters,
} from "@/hooks/use-finance";
import { usePaginationQueryStates } from "@/hooks/usePaginationQueryStates";
import { formatCurrency, formatHours, percentOf } from "@/utils/currency";
import { Box, Flex, Grid, Text } from "@chakra-ui/react";
import { Clock, DollarSign, Hourglass, PieChart, Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { parseAsString, useQueryState } from "nuqs";
import { LogTimeDialog } from "../../components/dialogs/log-time-dialog";
import {
  EarningsByStaffCard,
  TopMattersCard,
} from "../../components/earnings-cards";
import { TimeEntriesTable } from "../../components/time-entries-table";
import { TIME_ENTRY_OPTIONS } from "../../data";

export default function TimeBillingTab() {
  const [status, setStatus] = useQueryState(
    "entries",
    parseAsString.withDefault("all"),
  );
  const { currentPage, limit, setPagination } = usePaginationQueryStates();
  const [logOpen, setLogOpen] = useState(false);
  const { showConfirm } = useConfirmDialog();

  const params = useMemo(
    () => ({
      status: status as TimeEntryStatusFilter,
      page: currentPage,
      limit,
    }),
    [status, currentPage, limit],
  );

  const entries = useTimeEntries(params);
  const stats = useTimeBillingStats();
  const earnings = useEarningsByStaff();
  const topMatters = useTopMatters();

  const approve = useApproveTimeEntry();
  const reject = useRejectTimeEntry();

  const onStatus = useCallback(
    (value: string) => {
      void setStatus(value || "all");
      void setPagination({ currentPage: 1 });
    },
    [setStatus, setPagination],
  );

  // Rejecting discards billable work, so it asks first and records a reason.
  const onReject = useCallback(
    (row: TimeEntryRow) => {
      showConfirm({
        title: "Reject this time entry?",
        description: `${row.staffName}'s ${row.hoursWorked.toFixed(1)}h on ${row.caseNumber ?? "no matter"} will be excluded from earnings and cannot be invoiced.`,
        confirmLabel: "Reject entry",
        onConfirm: () =>
          reject.mutate({ id: row.id, reason: "Rejected by approver" }),
      });
    },
    [reject, showConfirm],
  );

  const s = stats.data;

  return (
    <Box>
      <Grid
        templateColumns={{ base: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }}
        gap="16px"
      >
        <StatTile
          variant="icon-top"
          label="Total hours this month"
          value={formatHours(s?.hoursLogged ?? 0)}
          caption={`${formatHours(s?.billableHours ?? 0)} billable`}
          icon={<Clock size={15} />}
          tone="info"
          mutedValue
          progress={percentOf(s?.billableHours ?? 0, s?.hoursLogged ?? 0)}
        />
        <StatTile
          variant="icon-top"
          label="Billable revenue"
          value={formatCurrency(s?.totalEarnings ?? 0)}
          caption="At blended rate"
          icon={<DollarSign size={15} />}
          tone="info"
          mutedValue
          progress={100}
        />
        <StatTile
          variant="icon-top"
          label="Billable rate"
          value={`${s?.billableRate ?? 0}%`}
          caption={`${formatHours(s?.billableHours ?? 0)} of ${formatHours(s?.hoursLogged ?? 0)}`}
          icon={<PieChart size={15} />}
          tone="success"
          progress={s?.billableRate ?? 0}
        />
        <StatTile
          variant="icon-top"
          label="Pending approval"
          value={s?.pendingCount ?? 0}
          caption={`${s?.approvedCount ?? 0} already approved`}
          icon={<Hourglass size={15} />}
          tone="warning"
          progress={percentOf(
            s?.pendingCount ?? 0,
            (s?.pendingCount ?? 0) + (s?.approvedCount ?? 0),
          )}
        />
      </Grid>

      {/* A firm with no configured rates would otherwise see $0 everywhere and
          assume the tab is broken rather than unconfigured. */}
      {(s?.rateUnsetCount ?? 0) > 0 && (
        <Flex
          mt="16px"
          p="12px 14px"
          borderRadius="10px"
          border="1px solid"
          borderColor="#f0dcae"
          bg="#fdf6e6"
          _dark={{
            bg: "rgba(181, 133, 31, 0.12)",
            borderColor: "rgba(181,133,31,0.35)",
          }}
        >
          <Text fontSize="12px" color="fg.muted">
            <b>{s?.rateUnsetCount} entries have no billing rate.</b> Set a rate
            for those staff members so their time can be valued and invoiced.
          </Text>
        </Flex>
      )}

      <Grid
        templateColumns={{ base: "1fr", xl: "minmax(0, 2.2fr) minmax(0, 1fr)" }}
        gap="16px"
        mt="20px"
        alignItems="start"
      >
        <SurfaceCard>
          <Flex
            justify="space-between"
            align="center"
            gap="12px"
            flexWrap="wrap"
            mb="14px"
          >
            <Text textStyle="label" fontWeight="700">
              Time entries
            </Text>
            <Flex gap="8px" align="center" flexWrap="wrap">
              <FilterCombobox
                options={TIME_ENTRY_OPTIONS}
                value={status === "all" ? "" : status}
                onChange={onStatus}
                placeholder="All entries"
                noun="entry type"
              />
              <Text fontSize="12px" color="fg.muted" whiteSpace="nowrap">
                {entries.data?.pagination.total ?? 0} entries
              </Text>
              <BrandButton onClick={() => setLogOpen(true)}>
                <Plus size={14} />
                Log time
              </BrandButton>
            </Flex>
          </Flex>

          <TimeEntriesTable
            rows={entries.data?.data ?? []}
            totals={entries.data?.totals}
            isLoading={entries.isLoading}
            isMutating={approve.isPending || reject.isPending}
            onApprove={(row) => approve.mutate(row.id)}
            onReject={onReject}
          />

          {entries.data && entries.data.pagination.total > limit && (
            <Box mt="14px">
              <PaginationControls
                total={entries.data.pagination.total}
                currentPage={currentPage}
                limit={limit}
                onPageChange={(page) => void setPagination({ currentPage: page })}
                onLimitChange={(l) =>
                  void setPagination({ currentPage: 1, limit: l })
                }
              />
            </Box>
          )}
        </SurfaceCard>

        <Flex direction="column" gap="16px">
          <EarningsByStaffCard
            rows={earnings.data ?? []}
            isLoading={earnings.isLoading}
          />
          <TopMattersCard
            data={topMatters.data}
            isLoading={topMatters.isLoading}
          />
        </Flex>
      </Grid>

      <LogTimeDialog open={logOpen} onOpenChange={(d) => setLogOpen(d.open)} />
    </Box>
  );
}
