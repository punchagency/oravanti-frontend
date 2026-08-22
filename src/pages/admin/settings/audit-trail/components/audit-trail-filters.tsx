import {
  Box,
  Button,
  Flex,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Download, Search, X } from "lucide-react";
import { useMemo } from "react";
import { DateField } from "@/components/ui/date-field";
import { labelForDomain, labelForCategory } from "@/lib/audit";
import { useAuditTrailData } from "../audit-trail-data-context";
import { FacetCombobox } from "./facet-combobox";

export function AuditTrailFilters() {
  const {
    searchDraft,
    setSearchDraft,
    domain,
    setDomain,
    category,
    setCategory,
    action,
    setAction,
    from,
    setFrom,
    to,
    setTo,
    facets,
    actionOptions,
    isFiltered,
    clearAll,
    exporting,
    handleExport,
  } = useAuditTrailData();

  const domainItems = useMemo(
    () =>
      (facets?.domains ?? []).map((d) => ({
        value: d.domain,
        label: `${labelForDomain(d.domain)} (${d.count})`,
      })),
    [facets],
  );

  const categoryItems = useMemo(
    () =>
      (facets?.categories ?? []).map((c) => ({
        value: c.category,
        label: `${labelForCategory(c.category)} (${c.count})`,
      })),
    [facets],
  );

  const actionItems = useMemo(
    () =>
      actionOptions.map((a) => ({
        value: a.action,
        label: `${a.label} (${a.count})`,
      })),
    [actionOptions],
  );

  return (
    <Flex gap={3} flexWrap="wrap" align="center" justify="space-between">
      <Stack direction="row" gap={3} flexWrap="wrap" flex="1 1 auto">
        <Box position="relative" w={{ base: "full", md: "180px", lg: "220px" }}>
          <Box
            position="absolute"
            left={3}
            top="50%"
            transform="translateY(-50%)"
            zIndex={1}
            color="fg.subtle"
            pointerEvents="none"
          >
            <Search size={16} />
          </Box>
          <Input
            placeholder="Search summaries..."
            pl={9}
            size={{ base: "xs", md: "sm" }}
            bg="bg.input"
            borderColor="border.input"
            borderRadius="md"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
          />
        </Box>

        <FacetCombobox
          items={domainItems}
          value={domain}
          onChange={setDomain}
          placeholder="All areas"
          minW={{ md: "160px" }}
          noMatchLabel={(search) => `No areas matching "${search}"`}
        />

        <FacetCombobox
          items={categoryItems}
          value={category}
          onChange={setCategory}
          placeholder="All categories"
          minW={{ md: "160px" }}
          noMatchLabel={(search) => `No categories matching "${search}"`}
        />

        <FacetCombobox
          items={actionItems}
          value={action}
          onChange={setAction}
          placeholder="All events"
          minW={{ md: "190px" }}
          noMatchLabel={(search) => `No events matching "${search}"`}
        />

        <Box w={{ base: "full", md: "150px" }}>
          <DateField
            value={from}
            onChange={setFrom}
            ariaLabel="From date"
          />
        </Box>

        <Box w={{ base: "full", md: "150px" }}>
          <DateField
            value={to}
            onChange={setTo}
            min={from || undefined}
            ariaLabel="To date"
          />
        </Box>

        {isFiltered && (
          <Button
            variant="ghost"
            size={{ base: "xs", md: "sm" }}
            color="fg.muted"
            onClick={clearAll}
            flexShrink={0}
          >
            <X size={14} />
            <Text display={{ base: "inline", md: "none" }} ml={1}>
              Clear
            </Text>
            <Text display={{ base: "none", md: "inline" }}>Clear filters</Text>
          </Button>
        )}
      </Stack>

      <Button
        variant="outline"
        size={{ base: "xs", md: "sm" }}
        onClick={handleExport}
        loading={exporting}
        flexShrink={0}
      >
        <Download size={14} /> Export CSV
      </Button>
    </Flex>
  );
}
