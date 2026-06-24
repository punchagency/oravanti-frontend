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
import { Search, X, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { PRACTICE_AREAS } from "@/utils/practice-areas";

const practiceAreaOptions = createListCollection({
  items: [
    { value: "all", label: "All practice areas" },
    ...PRACTICE_AREAS.map((pa) => ({ value: pa.value, label: pa.label })),
  ],
});

const filingTypeOptions = createListCollection({
  items: [
    { value: "all", label: "All filing types" },
    { value: "i485", label: "I-485" },
    { value: "i130", label: "I-130" },
  ],
});

const stageOptions = createListCollection({
  items: [
    { value: "all", label: "All stages" },
    { value: "intake", label: "Intake" },
    { value: "filed", label: "Filed" },
  ],
});

const staffOptions = createListCollection({
  items: [
    { value: "all", label: "All staff" },
    { value: "john", label: "John Doe" },
    { value: "jane", label: "Jane Smith" },
  ],
});

interface CasesFiltersProps {
  casesCount?: number;
  sortDirection?: "asc" | "desc";
  onSortToggle?: () => void;
  onSearchChange?: (value: string) => void;
  onPracticeAreaChange?: (value: string) => void;
  onFilingTypeChange?: (value: string) => void;
  onStageChange?: (value: string) => void;
  onStaffChange?: (value: string) => void;
}

export function CasesFilters({
  casesCount = 0,
  sortDirection = "asc",
  onSortToggle,
  onSearchChange,
  onPracticeAreaChange,
  onFilingTypeChange,
  onStageChange,
  onStaffChange,
}: CasesFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [practiceArea, setPracticeArea] = useState("all");
  const [filingType, setFilingType] = useState("all");
  const [stage, setStage] = useState("all");
  const [staff, setStaff] = useState("all");

  const hasActiveFilters =
    searchQuery !== "" ||
    practiceArea !== "all" ||
    filingType !== "all" ||
    stage !== "all" ||
    staff !== "all";

  function clearFilters() {
    setSearchQuery("");
    setPracticeArea("all");
    setFilingType("all");
    setStage("all");
    setStaff("all");
    onSearchChange?.("");
  }

  return (
    <Box mb={6}>
      <Flex
        direction={{ base: "column", lg: "row" }}
        gap={3}
        mb={3}
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
              placeholder="Search matters, clients, ref..."
              pl={9}
              size={{ base: "xs", md: "sm" }}
              bg="bg.input"
              borderColor="border.input"
              borderRadius="md"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearchChange?.(e.target.value);
              }}
            />
          </Box>

          <Select.Root
            collection={practiceAreaOptions}
            size={{ base: "xs", md: "sm" }}
            w={{ base: "full", md: "auto" }}
            minW={{ md: "160px" }}
            value={[practiceArea]}
            onValueChange={(e) => {
              setPracticeArea(e.value[0] ?? "all");
              onPracticeAreaChange?.(e.value[0] ?? "all");
            }}
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
                  {practiceAreaOptions.items.map((opt) => (
                    <Select.Item
                      item={opt}
                      key={opt.value}
                      _hover={{ bg: "bg.muted" }}
                      _focus={{ bg: "bg.subtle" }}
                      bg="transparent"
                      _selected={{ bg: "transparent" }}
                    >
                      <Select.ItemText>{opt.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>

          <Select.Root
            collection={filingTypeOptions}
            size={{ base: "xs", md: "sm" }}
            w={{ base: "full", md: "auto" }}
            minW={{ md: "160px" }}
            value={[filingType]}
            onValueChange={(e) => {
              setFilingType(e.value[0] ?? "all");
              onFilingTypeChange?.(e.value[0] ?? "all");
            }}
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
                  {filingTypeOptions.items.map((opt) => (
                    <Select.Item
                      item={opt}
                      key={opt.value}
                      _hover={{ bg: "bg.muted" }}
                      _focus={{ bg: "bg.subtle" }}
                      bg="transparent"
                      _selected={{ bg: "transparent" }}
                    >
                      <Select.ItemText>{opt.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>

          <Select.Root
            collection={stageOptions}
            size={{ base: "xs", md: "sm" }}
            w={{ base: "full", md: "auto" }}
            minW={{ md: "130px" }}
            value={[stage]}
            onValueChange={(e) => {
              setStage(e.value[0] ?? "all");
              onStageChange?.(e.value[0] ?? "all");
            }}
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
                  {stageOptions.items.map((opt) => (
                    <Select.Item
                      item={opt}
                      key={opt.value}
                      _hover={{ bg: "bg.muted" }}
                      _focus={{ bg: "bg.subtle" }}
                      bg="transparent"
                      _selected={{ bg: "transparent" }}
                    >
                      <Select.ItemText>{opt.label}</Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>

          <Select.Root
            collection={staffOptions}
            size={{ base: "xs", md: "sm" }}
            w={{ base: "full", md: "auto" }}
            minW={{ md: "130px" }}
            value={[staff]}
            onValueChange={(e) => {
              setStaff(e.value[0] ?? "all");
              onStaffChange?.(e.value[0] ?? "all");
            }}
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
                  {staffOptions.items.map((opt) => (
                    <Select.Item
                      item={opt}
                      key={opt.value}
                      _hover={{ bg: "bg.muted" }}
                      _focus={{ bg: "bg.subtle" }}
                      bg="transparent"
                      _selected={{ bg: "transparent" }}
                    >
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

        <Button
          variant="outline"
          size={{ base: "xs", md: "sm" }}
          flexShrink={0}
          onClick={onSortToggle}
        >
          <ArrowUpDown size={14} />
          Sort
        </Button>
      </Flex>

      <Flex justify="flex-end">
        <Text
          textStyle="body-sm"
          color="fg.muted"
          whiteSpace="nowrap"
          display={{ base: "none", md: "block" }}
        >
          {casesCount} matter{casesCount !== 1 ? "s" : ""}
        </Text>
      </Flex>
    </Box>
  );
}
