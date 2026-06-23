import { useTeamsList } from "@/hooks/use-teams-list";
import {
  Box,
  Button,
  Combobox,
  createListCollection,
  Flex,
  Input,
  Portal,
  Select,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useStaffData } from "../staff-data-context";

const roleOptions = createListCollection({
  items: [
    { value: "all-roles", label: "All roles" },
    { value: "attorney", label: "Attorney" },
    { value: "paralegal", label: "Paralegal" },
    { value: "admin", label: "Admin" },
  ],
});

const statusOptions = createListCollection({
  items: [
    { value: "all-statuses", label: "All statuses" },
    { value: "active", label: "Active" },
    { value: "on_leave", label: "On leave" },
    { value: "recertify_required", label: "Recertify required" },
    { value: "pending_invitation", label: "Pending invitation" },
  ],
});

export function StaffFilters() {
  const {
    filteredStaff,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    teamFilter,
    setTeamFilter,
    statusFilter,
    setStatusFilter,
  } = useStaffData();

  const { data: teamsData } = useTeamsList({ limit: 100 });
  const teams = teamsData?.data ?? [];
  const [teamSearch, setTeamSearch] = useState("");

  const teamCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { label: "All teams", value: "all-teams" },
          ...teams.map((t) => ({ label: t.name, value: t.name })),
        ],
      }),
    [teams],
  );

  const hasActiveFilters =
    searchQuery !== "" ||
    roleFilter !== "all-roles" ||
    teamFilter !== "all-teams" ||
    statusFilter !== "all-statuses";

  function clearFilters() {
    setSearchQuery("");
    setRoleFilter("all-roles");
    setTeamFilter("all-teams");
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
            placeholder="Search staff by name..."
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
          collection={roleOptions}
          size={{ base: "xs", md: "sm" }}
          w={{ base: "full", md: "auto" }}
          minW={{ md: "130px" }}
          value={[roleFilter]}
          onValueChange={(e) => setRoleFilter(e.value[0] ?? "all-roles")}
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
                {roleOptions.items.map((opt) => (
                  <Select.Item item={opt} key={opt.value}>
                    <Select.ItemText>{opt.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>

        <Combobox.Root
          collection={teamCollection}
          size={{ base: "xs", md: "sm" }}
          w={{ base: "full", md: "auto" }}
          minW={{ md: "180px" }}
          value={[teamFilter]}
          onValueChange={(e) => setTeamFilter(e.value[0] ?? "all-teams")}
          onInputValueChange={(e) => setTeamSearch(e.inputValue)}
          positioning={{ sameWidth: true }}
          openOnClick
        >
          <Combobox.Control>
            <Combobox.Input
              placeholder="All teams"
              bg="bg.input"
              borderColor="border.input"
              borderRadius="md"
            />
            <Combobox.IndicatorGroup>
              <Combobox.Trigger />
            </Combobox.IndicatorGroup>
          </Combobox.Control>
          <Portal>
            <Combobox.Positioner>
              <Combobox.Content>
                {teams.length === 0 ? (
                  <Flex p={3} gap={2} align="center" justify="center">
                    <Spinner size="xs" />
                    <Text fontSize="sm" color="fg.muted">
                      Loading...
                    </Text>
                  </Flex>
                ) : (() => {
                  const filtered = teamCollection.items.filter(
                    (item) =>
                      !teamSearch ||
                      item.label.toLowerCase().includes(teamSearch.toLowerCase()),
                  );
                  return filtered.length === 0 ? (
                    <Text p={3} fontSize="sm" color="fg.muted">
                      No teams matching &ldquo;{teamSearch}&rdquo;
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
        {filteredStaff.length} staff member
        {filteredStaff.length !== 1 ? "s" : ""}
      </Text>
    </Flex>
  );
}
