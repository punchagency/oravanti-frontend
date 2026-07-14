import { Flex, HStack, Text } from "@chakra-ui/react";
import { useMemo, useState } from "react";
import type { Lead } from "@/api/leads";
import type { FormSelectOption } from "@/components/ui/form-select";
import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
import { useCrmLeadsData } from "../crm-leads-data-context";
import {
  buildPracticeAreaMap,
  sourceFilterOptions,
  stageOptions,
} from "../data";
import { LeadDrawer } from "./lead-drawer";
import {
  LeadsFilterSelect,
  LeadsSearchBox,
  LeadsTable,
} from "./leads-table";

const COLUMNS = [
  "CLIENT / LEAD",
  "PRACTICE AREA",
  "STAGE",
  "SOURCE",
  "RECEIVED",
  "ACTION",
];

export function PipelineTab() {
  const {
    leads,
    isLoading,
    total,
    searchQuery,
    setSearchQuery,
    stageFilter,
    setStageFilter,
    practiceAreaFilter,
    setPracticeAreaFilter,
    sourceFilter,
    setSourceFilter,
    currentPage,
    limit,
    setPagination,
  } = useCrmLeadsData();

  const [openLeadId, setOpenLeadId] = useState<string | null>(null);

  const { data: practiceAreas } = usePublicPracticeAreas();
  const practiceAreaMap = useMemo(
    () => buildPracticeAreaMap(practiceAreas ?? []),
    [practiceAreas],
  );

  const practiceAreaOptions = useMemo<FormSelectOption[]>(
    () => [
      { label: "All practice areas", value: "" },
      ...(practiceAreas ?? []).map((area) => ({
        label: area.name,
        value: area.id,
      })),
    ],
    [practiceAreas],
  );

  const stageSelectOptions = useMemo<FormSelectOption[]>(
    () => stageOptions.map((o) => ({ label: o.label, value: o.value })),
    [],
  );

  const sourceSelectOptions = useMemo<FormSelectOption[]>(
    () => sourceFilterOptions.map((o) => ({ label: o.label, value: o.value })),
    [],
  );

  // The lead_inbox and case_opening stages are where a lead is waiting on the
  // firm to act, so they get the primary affordance.
  const isPrimary = (lead: Lead) =>
    lead.pipelineStage === "lead_inbox" ||
    lead.pipelineStage === "case_opening";

  return (
    <>
      <Flex
        align="center"
        justify="space-between"
        gap="16px"
        my="20px"
        wrap="wrap"
      >
        <HStack gap="10px" wrap="wrap">
          <LeadsSearchBox value={searchQuery} onChange={setSearchQuery} />

          <LeadsFilterSelect
            ariaLabel="Filter by stage"
            placeholder="All stages"
            options={stageSelectOptions}
            value={stageFilter}
            onChange={setStageFilter}
          />

          <LeadsFilterSelect
            ariaLabel="Filter by practice area"
            placeholder="All practice areas"
            options={practiceAreaOptions}
            value={practiceAreaFilter}
            onChange={setPracticeAreaFilter}
          />

          <LeadsFilterSelect
            ariaLabel="Filter by source"
            placeholder="All sources"
            options={sourceSelectOptions}
            value={sourceFilter}
            onChange={setSourceFilter}
          />
        </HStack>

        <Text m="0" color="fg.muted" fontSize="11px">
          {isLoading
            ? "Loading…"
            : `${total} ${total === 1 ? "record" : "records"}`}
        </Text>
      </Flex>

      <LeadsTable
        leads={leads}
        isLoading={isLoading}
        practiceAreas={practiceAreaMap}
        columns={COLUMNS}
        renderAction={(lead) =>
          isPrimary(lead) ? (
            <BrandButton
              h="28px"
              minH="28px"
              px="12px"
              fontSize="12px"
              onClick={() => setOpenLeadId(lead.id)}
            >
              Review
            </BrandButton>
          ) : (
            <OutlineButton
              h="28px"
              minH="28px"
              px="12px"
              fontSize="12px"
              onClick={() => setOpenLeadId(lead.id)}
            >
              View
            </OutlineButton>
          )
        }
      />

      {total > 0 && (
        <PaginationControls
          total={total}
          currentPage={currentPage}
          limit={limit}
          onPageChange={(page) => setPagination({ currentPage: page })}
          onLimitChange={(next) =>
            setPagination({ limit: next, currentPage: 1 })
          }
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
    </>
  );
}
