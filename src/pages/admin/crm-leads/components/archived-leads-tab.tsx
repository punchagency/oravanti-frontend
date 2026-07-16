import { Box, Flex, Grid, HStack, Text } from "@chakra-ui/react";
import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { useDebounce } from "@uidotdev/usehooks";
import type { Lead } from "@/api/leads";
import { OutlineButton } from "@/components/ui/intake-ui";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useLeads, useRestoreLead } from "@/hooks/use-leads";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
import { buildPracticeAreaMap } from "../data";
import { LeadDrawer } from "./lead-drawer";
import { LeadsSearchBox, LeadsTable } from "./leads-table";

const COLUMNS = [
  "CLIENT / LEAD",
  "PRACTICE AREA",
  "STAGE AT ARCHIVE",
  "SOURCE",
  "RECEIVED",
  "ACTION",
];

const PAGE_SIZE = 10;

function SummaryCard({
  label,
  count,
  note,
  color,
}: {
  label: string;
  count: number | string;
  note: string;
  color: string;
}) {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      p="16px 18px"
    >
      <Text
        m="0 0 4px"
        color="fg.muted"
        fontSize="10px"
        fontWeight="500"
        textTransform="uppercase"
        letterSpacing="0.04em"
      >
        {label}
      </Text>
      <Text
        m="0 0 4px"
        color={color}
        fontSize="28px"
        fontWeight="600"
        lineHeight="1.1"
      >
        {count}
      </Text>
      <Text m="0" color="fg.muted" fontSize="11px">
        {note}
      </Text>
    </Box>
  );
}

export function ArchivedLeadsTab() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading } = useLeads({
    status: "archived",
    search: debouncedQuery || undefined,
    page,
    limit,
  });

  // Declined leads are a separate terminal state from archived, and the two
  // were previously conflated behind a "—" placeholder.
  const { data: declinedData } = useLeads({ status: "declined", limit: 1 });

  const restoreLead = useRestoreLead();

  const { data: practiceAreas } = usePublicPracticeAreas();
  const practiceAreaMap = useMemo(
    () => buildPracticeAreaMap(practiceAreas ?? []),
    [practiceAreas],
  );

  const leads = data?.leads ?? [];
  // The total comes from the server, not leads.length — that was only ever the
  // count of rows on the current page.
  const total = data?.pagination?.total ?? 0;
  const declinedTotal = declinedData?.pagination?.total ?? 0;

  const convertedCount = leads.filter((l: Lead) => l.convertedCaseId).length;

  return (
    <Box mt="20px">
      <Grid
        templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
        gap="14px"
        mb="24px"
      >
        <SummaryCard
          label="Archived"
          count={total}
          note="Removed from the active pipeline"
          color="#6b6252"
        />
        <SummaryCard
          label="Declined"
          count={declinedTotal}
          note="Terminated for conflict — cannot be restored"
          color="#b00020"
        />
        <SummaryCard
          label="Converted before archive"
          count={convertedCount}
          note="On this page"
          color="#1D9E75"
        />
      </Grid>

      <Flex
        align="center"
        justify="space-between"
        gap="16px"
        mb="16px"
        wrap="wrap"
      >
        <LeadsSearchBox
          value={query}
          onChange={(value) => {
            setQuery(value);
            setPage(1);
          }}
          placeholder="Search archived leads..."
        />

        <Text m="0" color="fg.muted" fontSize="11px">
          {isLoading
            ? "Loading…"
            : `${total} archived ${total === 1 ? "lead" : "leads"}`}
        </Text>
      </Flex>

      <LeadsTable
        leads={leads}
        isLoading={isLoading}
        practiceAreas={practiceAreaMap}
        columns={COLUMNS}
        emptyMessage="No archived leads."
        renderAction={(lead) => (
          <HStack gap="6px">
            <OutlineButton
              h="28px"
              minH="28px"
              px="12px"
              fontSize="12px"
              onClick={() => setOpenLeadId(lead.id)}
            >
              View
            </OutlineButton>
            <OutlineButton
              h="28px"
              minH="28px"
              px="12px"
              fontSize="12px"
              loading={
                restoreLead.isPending && restoreLead.variables === lead.id
              }
              onClick={() => restoreLead.mutate(lead.id)}
            >
              <RotateCcw size={12} />
              Restore
            </OutlineButton>
          </HStack>
        )}
      />

      {total > 0 && (
        <PaginationControls
          total={total}
          currentPage={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(next) => {
            setLimit(next);
            setPage(1);
          }}
          pageSizeOptions={[10, 15, 20, 50]}
        />
      )}

      <LeadDrawer
        leadId={openLeadId}
        open={openLeadId !== null}
        onOpenChange={(open) => {
          if (!open) setOpenLeadId(null);
        }}
      />
    </Box>
  );
}
