import { Box, Flex, Input, NativeSelect } from "@chakra-ui/react";
import { Search } from "lucide-react";
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

function FilterSelect({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <NativeSelect.Root size="sm" w={{ base: "full", md: "150px" }}>
      <NativeSelect.Field
        value={value}
        onChange={(e) => onChange(e.currentTarget.value)}
        bg="bg.input"
        borderColor="border.input"
        borderRadius="7px"
        fontSize="13px"
      >
        <option value="">{placeholder}</option>
        {children}
      </NativeSelect.Field>
      <NativeSelect.Indicator />
    </NativeSelect.Root>
  );
}

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

  return (
    <Flex gap="10px" flexWrap="wrap" align="center">
      <Box position="relative" flex="1 1 280px" minW="220px">
        <Box
          position="absolute"
          left="12px"
          top="50%"
          transform="translateY(-50%)"
          zIndex={1}
          color="fg.subtle"
          pointerEvents="none"
        >
          <Search size={15} />
        </Box>
        <Input
          placeholder="Search documents, cases, types..."
          pl="36px"
          size="sm"
          bg="bg.input"
          borderColor="border.input"
          borderRadius="7px"
          fontSize="13px"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
        />
      </Box>

      <FilterSelect
        value={filters.matter}
        onChange={(v) => set("matter", v)}
        placeholder="All cases"
      >
        {documentCaseOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        value={filters.type}
        onChange={(v) => set("type", v)}
        placeholder="All types"
      >
        {documentTypeOptions.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        value={filters.status}
        onChange={(v) => set("status", v)}
        placeholder="All status"
      >
        {documentStatusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        value={filters.staff}
        onChange={(v) => set("staff", v)}
        placeholder="All staff"
      >
        {documentStaffOptions.map((staff) => (
          <option key={staff} value={staff}>
            {staff}
          </option>
        ))}
      </FilterSelect>
    </Flex>
  );
}
