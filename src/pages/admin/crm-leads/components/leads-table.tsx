import { Box, HStack, Input, Table, Text } from "@chakra-ui/react";
import { Search } from "lucide-react";
import type { ReactNode } from "react";
import { formatReceivedDate, sourceLabels, type Lead } from "@/api/leads";
import { FormSelect, type FormSelectOption } from "@/components/ui/form-select";
import {
  IntakeListSkeleton,
  PracticePill,
} from "@/components/ui/intake-ui";
import { practiceAreaName, stageLabel, stageTone } from "../data";

/**
 * The table shell shared by the Pipeline and Archived tabs. Both previously
 * hand-rolled an identical <Table.Root> with the same prop soup, and each kept
 * its own copy of the practice-area lookup and stage labels.
 */

export function LeadsSearchBox({
  value,
  onChange,
  placeholder = "Search clients and leads...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <HStack
      gap="8px"
      h="34px"
      minW="260px"
      px="12px"
      border="1px solid"
      borderColor="border"
      borderRadius="7px"
      bg="bg"
      color="fg.muted"
    >
      <Search size={14} />
      <Input
        aria-label="Search leads"
        placeholder={placeholder}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        p="0"
        h="auto"
        border="0"
        bg="transparent"
        color="fg"
        fontSize="13px"
        _focus={{ boxShadow: "none", outline: "0" }}
      />
    </HStack>
  );
}

export function LeadsFilterSelect({
  options,
  value,
  onChange,
  ariaLabel,
  // The "all" option carries an empty value, which FormSelect renders as
  // unselected — so the placeholder must read as that option.
  placeholder,
}: {
  options: FormSelectOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder: string;
}) {
  return (
    <Box minW="160px">
      <FormSelect
        options={options}
        value={value}
        onChange={onChange}
        ariaLabel={ariaLabel}
        placeholder={placeholder}
        width="full"
      />
    </Box>
  );
}

const columnHeaderStyles = {
  h: "36px",
  px: "16px",
  color: "fg.muted",
  fontSize: "10px",
  fontWeight: "500",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
} as const;

const cellStyles = {
  px: "16px",
  py: "10px",
  borderBottom: "1px solid",
  borderColor: "border.subtle",
} as const;

export function LeadsTable({
  leads,
  isLoading,
  practiceAreas,
  columns,
  renderAction,
  emptyMessage = "No leads found.",
}: {
  leads: Lead[];
  isLoading: boolean;
  practiceAreas: Map<string, string>;
  columns: string[];
  renderAction: (lead: Lead) => ReactNode;
  emptyMessage?: string;
}) {
  if (isLoading) {
    return (
      <Box py="8px">
        <IntakeListSkeleton rows={4} />
      </Box>
    );
  }

  return (
    <Box
      overflowX="auto"
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
    >
      <Table.Root minW="900px">
        <Table.Header>
          <Table.Row bg="bg.subtle">
            {columns.map((header) => (
              <Table.ColumnHeader key={header} {...columnHeaderStyles}>
                {header}
              </Table.ColumnHeader>
            ))}
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {leads.length === 0 ? (
            <Table.Row>
              <Table.Cell
                colSpan={columns.length}
                px="16px"
                py="24px"
                color="fg.muted"
                fontSize="13px"
              >
                {emptyMessage}
              </Table.Cell>
            </Table.Row>
          ) : (
            leads.map((lead) => {
              // The server joins the name in; the client-side map is only a
              // fallback for a lead whose practice area was deleted.
              const areaName =
                lead.practiceAreaName ??
                practiceAreaName(practiceAreas, lead.practiceAreaId);

              return (
                <Table.Row key={lead.id}>
                  <Table.Cell {...cellStyles}>
                    <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                      {lead.name}
                    </Text>
                    <Text m="0" color="fg.muted" fontSize="11px">
                      {lead.email}
                    </Text>
                  </Table.Cell>

                  <Table.Cell {...cellStyles}>
                    {areaName ? (
                      <PracticePill tone="neutral">{areaName}</PracticePill>
                    ) : (
                      <Text m="0" color="fg.muted" fontSize="13px">
                        —
                      </Text>
                    )}
                  </Table.Cell>

                  <Table.Cell {...cellStyles}>
                    <PracticePill tone={stageTone[lead.pipelineStage]}>
                      {stageLabel[lead.pipelineStage]}
                    </PracticePill>
                  </Table.Cell>

                  <Table.Cell
                    {...cellStyles}
                    color="fg.muted"
                    fontSize="13px"
                  >
                    {sourceLabels[lead.source]}
                  </Table.Cell>

                  <Table.Cell
                    {...cellStyles}
                    color="fg.muted"
                    fontSize="13px"
                  >
                    {formatReceivedDate(lead.receivedAt)}
                  </Table.Cell>

                  <Table.Cell {...cellStyles}>{renderAction(lead)}</Table.Cell>
                </Table.Row>
              );
            })
          )}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}
