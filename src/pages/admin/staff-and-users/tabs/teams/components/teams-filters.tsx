import {
  Box,
  Button,
  Combobox,
  createListCollection,
  Flex,
  Input,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTeamsData } from "../teams-data-context";

const statusItems = [
  { value: "available", label: "Available" },
  { value: "full", label: "Full" },
  { value: "overloaded", label: "Overloaded" },
];

export function TeamsFilters() {
  const { teams, searchQuery, setSearchQuery, statusFilter, setStatusFilter } =
    useTeamsData();

  const [statusSearch, setStatusSearch] = useState("");

  const statusCollection = useMemo(
    () => createListCollection({ items: statusItems }),
    [],
  );

  const hasActiveFilters = searchQuery !== "" || !!statusFilter;

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("");
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

        <Combobox.Root
          collection={statusCollection}
          size={{ base: "xs", md: "sm" }}
          w={{ base: "full", md: "auto" }}
          minW={{ md: "130px" }}
          value={[statusFilter]}
          onValueChange={(e) => {
            const val = e.value[0] ?? "";
            setStatusFilter(val);
            if (!val) setStatusSearch("");
          }}
          onInputValueChange={(e) => setStatusSearch(e.inputValue)}
          positioning={{ sameWidth: true }}
          openOnClick
        >
          <Combobox.Control>
            <Combobox.Input
              placeholder="All statuses"
              bg="bg.input"
              borderColor="border.input"
              borderRadius="md"
            />
            <Combobox.IndicatorGroup>
              {!!statusFilter && <Combobox.ClearTrigger />}
              <Combobox.Trigger />
            </Combobox.IndicatorGroup>
          </Combobox.Control>
          <Portal>
            <Combobox.Positioner>
              <Combobox.Content>
                {(() => {
                  const filtered = statusCollection.items.filter(
                    (item) =>
                      !statusSearch ||
                      item.label
                        .toLowerCase()
                        .includes(statusSearch.toLowerCase()),
                  );
                  return filtered.length === 0 ? (
                    <Text p={3} fontSize="sm" color="fg.muted">
                      No statuses matching &ldquo;{statusSearch}&rdquo;
                    </Text>
                  ) : (
                    filtered.map((item) => (
                      <Combobox.Item key={item.value} item={item}>
                        <Combobox.ItemText>{item.label}</Combobox.ItemText>
                      </Combobox.Item>
                    ))
                  );
                })()}
              </Combobox.Content>
            </Combobox.Positioner>
          </Portal>
        </Combobox.Root>

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
