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
import { Search, X, ArrowUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { PRACTICE_AREAS } from "@/utils/practice-areas";
import { statusFilterItems } from "../data";
import { useCasesData } from "../cases-data-context";

export function CasesFilters() {
  const {
    filteredCases,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    practiceAreaFilter,
    setPracticeAreaFilter,
    caseTypeFilter,
    setCaseTypeFilter,
    stageFilter,
    setStageFilter,
    teamFilter,
    setTeamFilter,
    sortDirection,
    setSortDirection,
  } = useCasesData();

  const [statusSearch, setStatusSearch] = useState("");
  const [practiceAreaSearch, setPracticeAreaSearch] = useState("");
  const [caseTypeSearch, setCaseTypeSearch] = useState("");
  const [stageSearch, setStageSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");

  const filters = {
    search: searchQuery,
    status: statusFilter,
    practiceArea: practiceAreaFilter,
    caseType: caseTypeFilter,
    stage: stageFilter,
    team: teamFilter,
  };

  const setFilter = (key: string, value: string) => {
    const setters: Record<string, (v: string) => void> = {
      search: setSearchQuery,
      status: setStatusFilter,
      practiceArea: setPracticeAreaFilter,
      caseType: setCaseTypeFilter,
      stage: setStageFilter,
      team: setTeamFilter,
    };
    setters[key]?.(value);
  };

  const statusCollection = useMemo(
    () => createListCollection({ items: statusFilterItems }),
    [],
  );

  const practiceAreaCollection = useMemo(
    () =>
      createListCollection({
        items: [
          ...PRACTICE_AREAS.map((pa) => ({ value: pa.value, label: pa.label })),
        ],
      }),
    [],
  );

  const caseTypeCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { value: "i485", label: "I-485 Adjustment of Status" },
          { value: "i130", label: "I-130 Petition" },
          { value: "i765", label: "I-765 Employment Authorization" },
          { value: "i589", label: "I-589 Asylum" },
        ],
      }),
    [],
  );

  const stageCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { value: "intake", label: "Intake" },
          { value: "filed", label: "Filed" },
        ],
      }),
    [],
  );

  const teamCollection = useMemo(
    () =>
      createListCollection({
        items: [
          { value: "immigration-a", label: "Immigration Team A" },
          { value: "immigration-b", label: "Immigration Team B" },
          { value: "family-a", label: "Family Team A" },
          { value: "criminal", label: "Criminal Team" },
        ],
      }),
    [],
  );

  const hasActiveFilters =
    filters.search !== "" ||
    !!filters.status ||
    !!filters.practiceArea ||
    !!filters.caseType ||
    !!filters.stage ||
    !!filters.team;

  return (
    <Flex
      gap={3}
      mb={6}
      flexWrap="wrap"
      align="center"
      justify="space-between"
    >
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
            placeholder="Search matters, clients, ref..."
            pl={9}
            size={{ base: "xs", md: "sm" }}
            bg="bg.input"
            borderColor="border.input"
            borderRadius="md"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
          />
        </Box>

        <Combobox.Root
          collection={statusCollection}
          size={{ base: "xs", md: "sm" }}
          w={{ base: "full", md: "auto" }}
          minW={{ md: "150px" }}
          value={[filters.status]}
          onValueChange={(e) => {
            const val = e.value[0] ?? "";
            setFilter("status", val);
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
              {!!filters.status && <Combobox.ClearTrigger />}
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

        <Combobox.Root
          collection={practiceAreaCollection}
          size={{ base: "xs", md: "sm" }}
          w={{ base: "full", md: "auto" }}
          minW={{ md: "160px" }}
          value={[filters.practiceArea]}
          onValueChange={(e) => {
            const val = e.value[0] ?? "";
            setFilter("practiceArea", val);
            if (!val) setPracticeAreaSearch("");
          }}
          onInputValueChange={(e) => setPracticeAreaSearch(e.inputValue)}
          positioning={{ sameWidth: true }}
          openOnClick
        >
          <Combobox.Control>
            <Combobox.Input
              placeholder="All practice areas"
              bg="bg.input"
              borderColor="border.input"
              borderRadius="md"
            />
            <Combobox.IndicatorGroup>
              {!!filters.practiceArea && <Combobox.ClearTrigger />}
              <Combobox.Trigger />
            </Combobox.IndicatorGroup>
          </Combobox.Control>
          <Portal>
            <Combobox.Positioner>
              <Combobox.Content>
                {(() => {
                  const filtered = practiceAreaCollection.items.filter(
                    (item) =>
                      !practiceAreaSearch ||
                      item.label
                        .toLowerCase()
                        .includes(practiceAreaSearch.toLowerCase()),
                  );
                  return filtered.length === 0 ? (
                    <Text p={3} fontSize="sm" color="fg.muted">
                      No practice areas matching &ldquo;{practiceAreaSearch}&rdquo;
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

        <Combobox.Root
          collection={caseTypeCollection}
          size={{ base: "xs", md: "sm" }}
          w={{ base: "full", md: "auto" }}
          minW={{ md: "150px" }}
          value={[filters.caseType]}
          onValueChange={(e) => {
            const val = e.value[0] ?? "";
            setFilter("caseType", val);
            if (!val) setCaseTypeSearch("");
          }}
          onInputValueChange={(e) => setCaseTypeSearch(e.inputValue)}
          positioning={{ sameWidth: true }}
          openOnClick
        >
          <Combobox.Control>
            <Combobox.Input
              placeholder="All case types"
              bg="bg.input"
              borderColor="border.input"
              borderRadius="md"
            />
            <Combobox.IndicatorGroup>
              {!!filters.caseType && <Combobox.ClearTrigger />}
              <Combobox.Trigger />
            </Combobox.IndicatorGroup>
          </Combobox.Control>
          <Portal>
            <Combobox.Positioner>
              <Combobox.Content>
                {(() => {
                  const filtered = caseTypeCollection.items.filter(
                    (item) =>
                      !caseTypeSearch ||
                      item.label
                        .toLowerCase()
                        .includes(caseTypeSearch.toLowerCase()),
                  );
                  return filtered.length === 0 ? (
                    <Text p={3} fontSize="sm" color="fg.muted">
                      No case types matching &ldquo;{caseTypeSearch}&rdquo;
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

        <Combobox.Root
          collection={stageCollection}
          size={{ base: "xs", md: "sm" }}
          w={{ base: "full", md: "auto" }}
          minW={{ md: "130px" }}
          value={[filters.stage]}
          onValueChange={(e) => {
            const val = e.value[0] ?? "";
            setFilter("stage", val);
            if (!val) setStageSearch("");
          }}
          onInputValueChange={(e) => setStageSearch(e.inputValue)}
          positioning={{ sameWidth: true }}
          openOnClick
        >
          <Combobox.Control>
            <Combobox.Input
              placeholder="All stages"
              bg="bg.input"
              borderColor="border.input"
              borderRadius="md"
            />
            <Combobox.IndicatorGroup>
              {!!filters.stage && <Combobox.ClearTrigger />}
              <Combobox.Trigger />
            </Combobox.IndicatorGroup>
          </Combobox.Control>
          <Portal>
            <Combobox.Positioner>
              <Combobox.Content>
                {(() => {
                  const filtered = stageCollection.items.filter(
                    (item) =>
                      !stageSearch ||
                      item.label
                        .toLowerCase()
                        .includes(stageSearch.toLowerCase()),
                  );
                  return filtered.length === 0 ? (
                    <Text p={3} fontSize="sm" color="fg.muted">
                      No stages matching &ldquo;{stageSearch}&rdquo;
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

        <Combobox.Root
          collection={teamCollection}
          size={{ base: "xs", md: "sm" }}
          w={{ base: "full", md: "auto" }}
          minW={{ md: "130px" }}
          value={[filters.team]}
          onValueChange={(e) => {
            const val = e.value[0] ?? "";
            setFilter("team", val);
            if (!val) setTeamSearch("");
          }}
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
              {!!filters.team && <Combobox.ClearTrigger />}
              <Combobox.Trigger />
            </Combobox.IndicatorGroup>
          </Combobox.Control>
          <Portal>
            <Combobox.Positioner>
              <Combobox.Content>
                {(() => {
                  const filtered = teamCollection.items.filter(
                    (item) =>
                      !teamSearch ||
                      item.label
                        .toLowerCase()
                        .includes(teamSearch.toLowerCase()),
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

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size={{ base: "xs", md: "sm" }}
            color="fg.muted"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("");
              setPracticeAreaFilter("");
              setCaseTypeFilter("");
              setStageFilter("");
              setTeamFilter("");
            }}
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

      <Flex align="center" gap={3} flexShrink={0}>
        <Button
          variant="outline"
          size={{ base: "xs", md: "sm" }}
          onClick={() =>
            setSortDirection(sortDirection === "asc" ? "desc" : "asc")
          }
        >
          <ArrowUpDown size={14} />
          Sort
        </Button>
        <Text
          textStyle="body-sm"
          color="fg.muted"
          whiteSpace="nowrap"
          display={{ base: "none", md: "block" }}
        >
          {filteredCases.length} matter{filteredCases.length !== 1 ? "s" : ""}
        </Text>
      </Flex>
    </Flex>
  );
}
