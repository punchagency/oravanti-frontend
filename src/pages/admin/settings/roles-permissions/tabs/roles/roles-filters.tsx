import {
  Button,
  createListCollection,
  Flex,
  Portal,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import { X } from "lucide-react";
import { useMemo } from "react";
import { RbacSearchInput } from "../../components/rbac-search-input";
import { ROLE_TYPE_FILTERS, useRolesData } from "./roles-data-context";

export function RolesFilters() {
  const { total, searchQuery, setSearchQuery, typeFilter, setTypeFilter } =
    useRolesData();

  const typeCollection = useMemo(
    () => createListCollection({ items: [...ROLE_TYPE_FILTERS] }),
    [],
  );

  const hasActiveFilters = searchQuery !== "" || typeFilter !== "all";

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
          placeholder="Search by name or description…"
        />
        <Select.Root
          collection={typeCollection}
          size="sm"
          w={{ base: "full", md: "160px" }}
          value={[typeFilter]}
          onValueChange={(e) => setTypeFilter((e.value[0] ?? "all") as typeof typeFilter)}
        >
          <Select.HiddenSelect />
          <Select.Control>
            <Select.Trigger rounded="md" bg="bg.input" borderColor="border.input">
              <Select.ValueText placeholder="All types" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content rounded="md">
                {typeCollection.items.map((item) => (
                  <Select.Item item={item} key={item.value} rounded="sm">
                    {item.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            color="fg.muted"
            onClick={() => {
              setSearchQuery("");
              setTypeFilter("all");
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
        {total} role{total !== 1 ? "s" : ""}
      </Text>
    </Flex>
  );
}
