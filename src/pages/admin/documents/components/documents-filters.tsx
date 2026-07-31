import { FilterCombobox } from "@/components/ui/filter-combobox";
import { Box, Flex, Input } from "@chakra-ui/react";
import { Search } from "lucide-react";
import { useMemo } from "react";
import {
  documentCaseOptions,
  documentStaffOptions,
  documentStatusOptions,
  documentTypeOptions,
} from "../data";

export type DocumentFilters = {
  search: string;
  matter: string;
  type: string;
  status: string;
  staff: string;
};

export function DocumentsFilters({
  filters,
  onChange,
}: {
  filters: DocumentFilters;
  onChange: (filters: DocumentFilters) => void;
}) {
  const set = <K extends keyof DocumentFilters>(
    key: K,
    value: DocumentFilters[K],
  ) => onChange({ ...filters, [key]: value });

  const typeOptions = useMemo(
    () => documentTypeOptions.map((type) => ({ value: type, label: type })),
    [],
  );
  const staffOptions = useMemo(
    () => documentStaffOptions.map((staff) => ({ value: staff, label: staff })),
    [],
  );

  return (
    <Flex gap="10px" flexWrap="wrap" align="center">
      <Box position="relative" flex="1 1 280px" minW="220px">
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
          placeholder="Search documents, cases, types..."
          pl={9}
          size={{ base: "xs", md: "sm" }}
          bg="bg.input"
          borderColor="border.input"
          borderRadius="md"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
        />
      </Box>

      <FilterCombobox
        options={documentCaseOptions}
        value={filters.matter}
        onChange={(value) => set("matter", value)}
        placeholder="All cases"
        noun="cases"
        minW="200px"
      />

      <FilterCombobox
        options={typeOptions}
        value={filters.type}
        onChange={(value) => set("type", value)}
        placeholder="All types"
        noun="types"
        minW="140px"
      />

      <FilterCombobox
        options={documentStatusOptions}
        value={filters.status}
        onChange={(value) => set("status", value)}
        placeholder="All status"
        noun="statuses"
        minW="150px"
      />

      <FilterCombobox
        options={staffOptions}
        value={filters.staff}
        onChange={(value) => set("staff", value)}
        placeholder="All staff"
        noun="staff"
        minW="150px"
      />
    </Flex>
  );
}
