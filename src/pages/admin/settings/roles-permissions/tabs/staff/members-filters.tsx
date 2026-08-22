import { useRoleGroups } from "@/hooks/use-role-groups";
import {
  Button,
  Combobox,
  createListCollection,
  Flex,
  Portal,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { RbacSearchInput } from "../../components/rbac-search-input";
import { useMembersData } from "./members-data-context";

interface FilterOption {
  value: string;
  label: string;
}

/** Searchable single-select filter, mirroring the combobox filters used on
 * the staff & users page (see `staff-filters.tsx`) but factored for reuse
 * across the role and group filters here. */
function FilterCombobox({
  options,
  value,
  onChange,
  placeholder,
  isLoading = false,
}: {
  options: FilterOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  isLoading?: boolean;
}) {
  const [search, setSearch] = useState("");
  const collection = useMemo(() => createListCollection({ items: options }), [options]);

  const filtered = useMemo(
    () =>
      collection.items.filter(
        (item) => !search || item.label.toLowerCase().includes(search.toLowerCase()),
      ),
    [collection, search],
  );

  return (
    <Combobox.Root
      collection={collection}
      size="sm"
      w={{ base: "full", md: "auto" }}
      minW={{ md: "160px" }}
      value={value ? [value] : []}
      onValueChange={(e) => {
        onChange(e.value[0] ?? "");
        if (!e.value[0]) setSearch("");
      }}
      onInputValueChange={(e) => setSearch(e.inputValue)}
      positioning={{ sameWidth: true }}
      openOnClick
    >
      <Combobox.Control>
        <Combobox.Input
          placeholder={placeholder}
          bg="bg.input"
          borderColor="border.input"
          borderRadius="md"
        />
        <Combobox.IndicatorGroup>
          {!!value && <Combobox.ClearTrigger />}
          <Combobox.Trigger />
        </Combobox.IndicatorGroup>
      </Combobox.Control>
      <Portal>
        <Combobox.Positioner>
          <Combobox.Content>
            {isLoading ? (
              <Flex p={3} gap={2} align="center" justify="center">
                <Spinner size="xs" />
                <Text fontSize="sm" color="fg.muted">Loading…</Text>
              </Flex>
            ) : filtered.length === 0 ? (
              <Text p={3} fontSize="sm" color="fg.muted">
                No matches{search ? ` for “${search}”` : ""}
              </Text>
            ) : (
              filtered.map((item) => (
                <Combobox.Item key={item.value} item={item}>
                  <Combobox.ItemText>{item.label}</Combobox.ItemText>
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              ))
            )}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
}

export function MembersFilters() {
  const {
    total,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    groupFilter,
    setGroupFilter,
    roles,
  } = useMembersData();

  const groupsQuery = useRoleGroups();
  const groups = useMemo(() => groupsQuery.data?.groups ?? [], [groupsQuery.data]);

  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r.name, label: r.label })),
    [roles],
  );
  const groupOptions = useMemo(
    () => groups.map((g) => ({ value: g.name, label: g.name })),
    [groups],
  );

  const hasActiveFilters =
    searchQuery !== "" || !!roleFilter || !!groupFilter;

  return (
    <Flex
      direction={{ base: "column", lg: "row" }}
      gap={3}
      mb={4}
      justify="space-between"
      align={{ lg: "center" }}
    >
      <Stack direction={{ base: "column", md: "row" }} gap={3} w="full">
        <RbacSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name or email…"
        />
        <FilterCombobox
          options={roleOptions}
          value={roleFilter}
          onChange={setRoleFilter}
          placeholder="All roles"
        />
        <FilterCombobox
          options={groupOptions}
          value={groupFilter}
          onChange={setGroupFilter}
          placeholder="All groups"
          isLoading={groupsQuery.isLoading}
        />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            color="fg.muted"
            onClick={() => {
              setSearchQuery("");
              setRoleFilter("");
              setGroupFilter("");
            }}
            flexShrink={0}
          >
            <X size={14} />
            Clear filters
          </Button>
        )}
      </Stack>

      <Text
        textStyle="body-sm"
        color="fg.muted"
        whiteSpace="nowrap"
        mt={{ base: 1, lg: 0 }}
        display={{ base: "none", md: "block" }}
      >
        {total} staff member{total !== 1 ? "s" : ""}
      </Text>
    </Flex>
  );
}
