import {
  Box,
  Dialog,
  Flex,
  HStack,
  Input,
  Table,
  Text,
  VStack,
  chakra,
} from "@chakra-ui/react";
import { Archive, Search, ShieldCheck, X } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  leadInboxLeads,
  leadSources,
  leadStatuses,
} from "../data";
import {
  AddOnWarning,
  MutedText,
  OutlineButton,
  PracticePill,
} from "./intake-ui";

type Lead = (typeof leadInboxLeads)[number];

export function LeadInboxView() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("All sources");
  const [status, setStatus] = useState("All statuses");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return leadInboxLeads.filter((lead) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          lead.name,
          lead.email,
          lead.phone,
          lead.practiceArea,
          lead.source,
          lead.status,
        ].some((value) => value.toLowerCase().includes(normalizedQuery));

      const matchesSource = source === "All sources" || lead.source === source;
      const matchesStatus = status === "All statuses" || lead.status === status;

      return matchesQuery && matchesSource && matchesStatus;
    });
  }, [query, source, status]);

  return (
    <>
      <Flex
        as="section"
        align="center"
        justify="space-between"
        gap="16px"
        my="24px"
        mb="18px"
        wrap="wrap"
        aria-label="Lead inbox controls"
      >
        <HStack gap="10px" wrap="wrap">
          <HStack
            gap="8px"
            h="34px"
            minW="280px"
            px="12px"
            border="1px solid"
            borderColor="border"
            borderRadius="7px"
            bg="bg"
            color="fg.muted"
          >
            <Search size={15} />
            <Input
              aria-label="Search leads"
              placeholder="Search leads..."
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              p="0"
              h="auto"
              border="0"
              bg="transparent"
              color="fg"
              _focus={{ boxShadow: "none", outline: "0" }}
            />
          </HStack>

          <FilterSelect
            ariaLabel="Filter by source"
            value={source}
            onChange={setSource}
            options={["All sources", ...leadSources]}
          />
          <FilterSelect
            ariaLabel="Filter by status"
            value={status}
            onChange={setStatus}
            options={["All statuses", ...leadStatuses]}
          />
        </HStack>
        <MutedText fontSize="11px">
          {filteredLeads.length} {filteredLeads.length === 1 ? "lead" : "leads"}
        </MutedText>
      </Flex>

      <Box
        overflowX="auto"
        border="1px solid"
        borderColor="border"
        borderRadius="10px"
        bg="bg"
        aria-label="Lead inbox table"
      >
        <Table.Root minW="980px">
          <Table.Header>
            <Table.Row bg="bg.subtle">
              {[
                "Name",
                "Contact",
                "Practice area interest",
                "Source",
                "Received",
                "Action",
              ].map((heading) => (
                <Table.ColumnHeader
                  key={heading}
                  h="36px"
                  px="16px"
                  color="fg.muted"
                  fontSize="10px"
                  fontWeight="500"
                  textTransform="uppercase"
                >
                  {heading}
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredLeads.map((lead) => (
              <Table.Row key={lead.email}>
                <Table.Cell px="16px" py="9px" borderBottom="1px solid" borderColor="border.subtle">
                  <Box color="fg" fontSize="13px" fontWeight="500">
                    {lead.name}
                  </Box>
                  <LeadStatus status={lead.status} />
                </Table.Cell>
                <Table.Cell px="16px" py="9px" color="fg.muted" fontSize="13px" borderBottom="1px solid" borderColor="border.subtle">
                  {lead.email}
                  <MutedText fontSize="11px">{lead.phone}</MutedText>
                </Table.Cell>
                <Table.Cell px="16px" py="9px" borderBottom="1px solid" borderColor="border.subtle">
                  <PracticePill tone={lead.practiceTone}>{lead.practiceArea}</PracticePill>
                  {!lead.addOnActive ? <AddOnWarning /> : null}
                </Table.Cell>
                <Table.Cell px="16px" py="9px" color="fg.muted" fontSize="13px" borderBottom="1px solid" borderColor="border.subtle">
                  {lead.source}
                </Table.Cell>
                <Table.Cell px="16px" py="9px" color="fg.muted" fontSize="13px" borderBottom="1px solid" borderColor="border.subtle">
                  {lead.received}
                </Table.Cell>
                <Table.Cell px="16px" py="9px" borderBottom="1px solid" borderColor="border.subtle">
                  <OutlineButton
                    h="28px"
                    minH="28px"
                    fontSize="12px"
                    onClick={() => setSelectedLead(lead)}
                  >
                    Review
                  </OutlineButton>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      <LeadReviewDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
      />
    </>
  );
}

function LeadReviewDrawer({
  lead,
  onClose,
}: {
  lead: Lead | null;
  onClose: () => void;
}) {
  return (
    <Dialog.Root
      open={Boolean(lead)}
      onOpenChange={(details) => {
        if (!details.open) {
          onClose();
        }
      }}
      placement="center"
    >
      <Dialog.Backdrop bg="transparent" />
      <Dialog.Positioner justifyContent="flex-end">
        <Dialog.Content
          w="340px"
          maxW="calc(100vw - 24px)"
          h="100vh"
          maxH="100vh"
          borderLeft="1px solid"
          borderColor="border.subtle"
          borderRadius="0"
          bg="bg"
          boxShadow="-12px 0 28px rgba(0, 0, 0, 0.12)"
          p="0"
          _open={{
            animationName: "slide-from-right, fade-in",
            animationDuration: "180ms",
          }}
          _closed={{
            animationName: "slide-to-right, fade-out",
            animationDuration: "140ms",
          }}
        >
          {lead ? (
            <Flex direction="column" h="full">
              <Box p="22px 20px 14px">
                <Flex align="flex-start" justify="space-between" gap="14px">
                  <Box minW="0">
                    <Dialog.Title color="fg" fontSize="16px" fontWeight="600" lineHeight="1.15">
                      {lead.name}
                    </Dialog.Title>
                    <PracticePill>{lead.source}</PracticePill>
                  </Box>
                  <chakra.button
                    type="button"
                    aria-label="Close lead review panel"
                    display="grid"
                    placeItems="center"
                    flex="0 0 auto"
                    w="34px"
                    h="34px"
                    border="1px solid"
                    borderColor="border"
                    borderRadius="full"
                    bg="bg"
                    color="fg.muted"
                    onClick={onClose}
                  >
                    <X size={16} />
                  </chakra.button>
                </Flex>
              </Box>

              <VStack
                align="stretch"
                gap="18px"
                flex="1"
                overflowY="auto"
                px="20px"
                pb="16px"
              >
                <LeadDetail label="Full name">{lead.name}</LeadDetail>
                <LeadDetail label="Email">{lead.email}</LeadDetail>
                <LeadDetail label="Phone">{lead.phone}</LeadDetail>
                <LeadDetail label="Practice area interest">
                  <PracticePill tone={lead.practiceTone}>{lead.practiceArea}</PracticePill>
                  {!lead.addOnActive ? <AddOnWarning /> : null}
                </LeadDetail>
                <LeadDetail label="Source">{lead.source}</LeadDetail>
                <LeadDetail label="Received">{lead.receivedDetail}</LeadDetail>
                <LeadDetail label="Situation summary">
                  <Box
                    mt="6px"
                    p="10px"
                    borderRadius="7px"
                    bg="bg.subtle"
                    color="fg"
                    fontSize="13px"
                    lineHeight="1.45"
                  >
                    {lead.situationSummary}
                  </Box>
                </LeadDetail>
              </VStack>

              <Box px="20px" py="16px" borderTop="1px solid" borderColor="border.subtle">
                <Text m="0 0 12px" color="fg" fontSize="12px" fontWeight="600">
                  Move this lead to
                </Text>
                <VStack align="stretch" gap="8px">
                  <OutlineButton
                    h="36px"
                    minH="36px"
                    layerStyle="brand-button"
                    borderColor="brand.solid"
                  >
                    <ShieldCheck size={14} />
                    Run conflict check
                  </OutlineButton>
                  <OutlineButton h="36px" minH="36px">
                    <Archive size={14} />
                    Archive lead
                  </OutlineButton>
                </VStack>
              </Box>
            </Flex>
          ) : null}
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function LeadDetail({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Text
        m="0 0 7px"
        color="fg.muted"
        fontSize="10px"
        fontWeight="600"
        lineHeight="1"
        textTransform="uppercase"
      >
        {label}
      </Text>
      <Box color="fg" fontSize="13px" fontWeight="500" lineHeight="1.25">
        {children}
      </Box>
    </Box>
  );
}

function FilterSelect({
  ariaLabel,
  value,
  onChange,
  options,
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <chakra.select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      h="34px"
      minW="156px"
      px="10px"
      border="1px solid"
      borderColor="border"
      borderRadius="7px"
      bg="bg"
      color="fg"
      fontSize="13px"
    >
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </chakra.select>
  );
}

function LeadStatus({ status }: { status: string }) {
  const tone = status === "New" ? "warning" : "neutral";

  return (
    <PracticePill tone={tone}>
      {status}
    </PracticePill>
  );
}
