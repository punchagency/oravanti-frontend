import {
  Box,
  Button,
  createListCollection,
  Flex,
  Input,
  Portal,
  Select,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Search, X } from "lucide-react";
import { useTeamsData } from "../teams-data-context";

const statusOptions = createListCollection({
  items: [
    { value: "all-statuses", label: "All statuses" },
    { value: "available", label: "Available" },
    { value: "full", label: "Full" },
    { value: "overloaded", label: "Overloaded" },
  ],
});

export function TeamsFilters() {
  const {
    teams,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
  } = useTeamsData();

  const hasActiveFilters =
    searchQuery !== "" || statusFilter !== "all-statuses";

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("all-statuses");
  }

  return (
    <Flex
      direction={{ base: "column", lg: "row" }}
      gap={3}
      mb={6}
      justify="space-between"
      align={{ lg: "center" }}
    >
      <Stack direction={{ base: "column", md: "row" }} gap={3} w="full">
        <Box position="relative" w="full" maxW={{ md: "240px" }}>
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
            placeholder="Search teams by name..."
            pl={9}
            size={{ base: "xs", md: "sm" }}
            bg="bg.input"
            borderColor="border.input"
            borderRadius="md"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Box>

        <Select.Root
          collection={statusOptions}
          size={{ base: "xs", md: "sm" }}
          w={{ base: "full", md: "auto" }}
          minW={{ md: "130px" }}
          value={[statusFilter]}
          onValueChange={(e) => setStatusFilter(e.value[0] ?? "all-statuses")}
        >
          <Select.Control>
            <Select.Trigger bg="bg.input" borderColor="border.input">
              <Select.ValueText />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
          <Portal>
            <Select.Positioner>
              <Select.Content>
                {statusOptions.items.map((opt) => (
                  <Select.Item item={opt} key={opt.value}>
                    <Select.ItemText>{opt.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size={{ base: "xs", md: "sm" }}
            color="fg.muted"
            onClick={clearFilters}
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

      <Text
        textStyle="body-sm"
        color="fg.muted"
        whiteSpace="nowrap"
        mt={{ base: 1, lg: 0 }}
        display={{ base: "none", md: "block" }}
      >
        {teams.length} team{teams.length !== 1 ? "s" : ""}
      </Text>
    </Flex>
  );
}
