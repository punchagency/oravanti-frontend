import type { PracticeAreaTreeNode } from "@/api/auth";
import { usePracticeAreaSubtrees } from "@/hooks/use-practice-area-tree-data";
import { leafIdsOf } from "@/utils/practice-area-tree";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Icon,
  IconButton,
  Input,
  ScrollArea,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ChevronDown, ChevronRight, FileText, X } from "lucide-react";
import {
  memo,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";

export interface CaseTypeSelectHandle {
  /** Current selection. Read at submit time so toggling never re-renders the form. */
  getSelectedIds: () => string[];
}

interface CaseTypeSelectProps {
  /** Practice areas whose case types should be offered. */
  selectedPracticeAreaIds: string[];
  /** Initial selection, applied once on mount. */
  defaultSelectedIds?: string[];
  onRemovePracticeArea: (practiceAreaId: string) => void;
  /**
   * Surface the "select at least one case type" message. Callers pass the
   * form's `isSubmitted` so it only appears once submit has been attempted.
   */
  showValidation?: boolean;
  ref?: Ref<CaseTypeSelectHandle>;
}

// Hoisted so React can bail out on identical element identity. The chevrons sit
// in a flex row beside wrapping text, so they must be told not to shrink.
const CHEVRON_RIGHT = (
  <Icon boxSize="14px" flexShrink={0}>
    <ChevronRight />
  </Icon>
);
const CHEVRON_DOWN = (
  <Icon boxSize="14px" flexShrink={0}>
    <ChevronDown />
  </Icon>
);
const CASE_TYPE_ICON = (
  <Icon boxSize="13px" flexShrink={0} mt="2px" color="fg.subtle">
    <FileText />
  </Icon>
);
const REMOVE_ICON = <X />;

const NO_CASE_TYPES: PracticeAreaTreeNode[] = [];

function countSelected(ids: string[], selected: Set<string>): number {
  let n = 0;
  for (const id of ids) {
    if (selected.has(id)) n++;
  }
  return n;
}

/**
 * Whether two selections agree about `ids`. Toggling one case type produces a
 * brand new Set, which defeats a reference-equality memo on every group even
 * though all but one of them are unaffected; comparing only the ids a group
 * actually renders lets the rest bail out.
 */
function sameSelection(
  ids: string[],
  prev: Set<string>,
  next: Set<string>,
): boolean {
  for (const id of ids) {
    if (prev.has(id) !== next.has(id)) return false;
  }
  return true;
}

/**
 * Multi-select over the practice-area taxonomy (practice area → subcategory →
 * case type).
 *
 * Selection state lives here rather than in the parent form on purpose: with it
 * lifted, every checkbox click re-rendered the whole dialog — date picker, team
 * select and all — which is what made both toggling and submitting feel slow.
 * The parent reads the final value through the ref instead.
 */
export function CaseTypeSelect({
  selectedPracticeAreaIds,
  defaultSelectedIds,
  onRemovePracticeArea,
  showValidation = false,
  ref,
}: CaseTypeSelectProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(defaultSelectedIds),
  );

  const { nodes: practiceAreas, isPending } = usePracticeAreaSubtrees(
    selectedPracticeAreaIds,
  );

  const selectedIdsRef = useRef(selectedIds);
  const availableLeafIdsRef = useRef<PracticeAreaTreeNode[]>(practiceAreas);
  const onRemovePracticeAreaRef = useRef(onRemovePracticeArea);
  useLayoutEffect(() => {
    selectedIdsRef.current = selectedIds;
    availableLeafIdsRef.current = practiceAreas;
    onRemovePracticeAreaRef.current = onRemovePracticeArea;
  });

  useImperativeHandle(ref, () => ({
    // Filtered against the practice areas still on screen: deselecting one in
    // the parent form hides its group without this component hearing about it,
    // and those case types must not end up in the payload.
    getSelectedIds: () => {
      const selected = selectedIdsRef.current;
      const ids: string[] = [];
      for (const pa of availableLeafIdsRef.current) {
        for (const id of leafIdsOf(pa)) {
          if (selected.has(id)) ids.push(id);
        }
      }
      return ids;
    },
  }), []);

  const query = search.trim().toLowerCase();
  const hasPracticeAreas = selectedPracticeAreaIds.length > 0;

  const toggleCaseType = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setGroupSelection = useCallback((ids: string[], checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) {
        if (checked) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const removePracticeArea = useCallback((practiceArea: PracticeAreaTreeNode) => {
    // Drop the practice area's case types alongside it, so a deselected area
    // can't leave orphaned ids in the payload.
    const leafIds = leafIdsOf(practiceArea);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of leafIds) next.delete(id);
      return next;
    });
    onRemovePracticeAreaRef.current(practiceArea.id);
  }, []);

  // Renders nothing until a practice area is picked, but stays mounted so the
  // selection survives clearing and re-picking one.
  if (!hasPracticeAreas) return null;

  return (
    <Stack w="full" gap="8px" mt="8px">
      <Input
        placeholder="Search case types..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        h="36px"
        px="12px"
        border="1px solid"
        borderColor="border"
        borderRadius="7px"
        bg="bg"
        color="fg"
        fontSize="13px"
        _placeholder={{ color: "fg.muted" }}
        _focus={{
          borderColor: "brand.solid",
          boxShadow: "0 0 0 1px var(--brand-cta)",
        }}
      />

      {isPending && practiceAreas.length === 0 ? (
        <Flex align="center" justify="center" gap="8px" py="20px">
          <Spinner size="sm" colorPalette="brand" />
          <Text fontSize="12px" color="fg.muted">
            Loading case types...
          </Text>
        </Flex>
      ) : (
        practiceAreas.map((pa) => (
          <PracticeAreaGroup
            key={pa.id}
            practiceArea={pa}
            selectedIds={selectedIds}
            query={query}
            showValidation={showValidation}
            onToggleCaseType={toggleCaseType}
            onSetGroupSelection={setGroupSelection}
            onRemovePracticeArea={removePracticeArea}
          />
        ))
      )}
    </Stack>
  );
}

interface PracticeAreaGroupProps {
  practiceArea: PracticeAreaTreeNode;
  selectedIds: Set<string>;
  query: string;
  showValidation: boolean;
  onToggleCaseType: (id: string) => void;
  onSetGroupSelection: (ids: string[], checked: boolean) => void;
  onRemovePracticeArea: (practiceArea: PracticeAreaTreeNode) => void;
}

const PracticeAreaGroup = memo(function PracticeAreaGroup({
  practiceArea: pa,
  selectedIds,
  query,
  showValidation,
  onToggleCaseType,
  onSetGroupSelection,
  onRemovePracticeArea,
}: PracticeAreaGroupProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set<string>(),
  );

  const toggleExpanded = useCallback((subcategoryId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(subcategoryId)) next.delete(subcategoryId);
      else next.add(subcategoryId);
      return next;
    });
  }, []);

  const handleRemove = useCallback(
    () => onRemovePracticeArea(pa),
    [onRemovePracticeArea, pa],
  );

  const subcategories = useMemo(() => {
    const all = pa.children ?? [];
    if (!query) {
      return all.map((sub) => ({ sub, matches: sub.children ?? NO_CASE_TYPES }));
    }
    const result: {
      sub: PracticeAreaTreeNode;
      matches: PracticeAreaTreeNode[];
    }[] = [];
    for (const sub of all) {
      const caseTypes = sub.children ?? NO_CASE_TYPES;
      // A subcategory whose own name matches keeps all of its case types.
      const matches = sub.name.toLowerCase().includes(query)
        ? caseTypes
        : caseTypes.filter((ct) => ct.name.toLowerCase().includes(query));
      if (matches.length > 0) result.push({ sub, matches });
    }
    return result;
  }, [pa.children, query]);

  const leafIds = leafIdsOf(pa);
  const selectedCount = countSelected(leafIds, selectedIds);
  const allSelected = leafIds.length > 0 && selectedCount === leafIds.length;

  // `leafIds` comes from a WeakMap cache keyed on the node, so it is stable for
  // as long as the query holds the tree — safe as a dependency.
  const handleToggleAll = useCallback(
    () => onSetGroupSelection(leafIds, !allSelected),
    [onSetGroupSelection, leafIds, allSelected],
  );

  return (
    // Deliberately not a Field.Root: Ark's checkbox takes its hidden-input id
    // from field context, so every checkbox inside one Field shares an id and
    // each label's htmlFor resolves to whichever input comes first in the DOM.
    <Stack w="full" gap="4px">
      <Box
        w="full"
        borderWidth="1px"
        borderColor="border.muted"
        borderRadius="md"
        p={3}
      >
        <Flex align="center" justify="space-between" gap={2} mb="6px">
          {/* Selects every case type in the area. Only the control is a click
              target — the name beside it is not a label, so a stray click on
              the header can't select the whole taxonomy branch. */}
          <Checkbox.Root
            size="sm"
            colorPalette="brand"
            checked={
              allSelected ? true : selectedCount > 0 ? "indeterminate" : false
            }
            onCheckedChange={handleToggleAll}
            cursor="pointer"
            flexShrink={0}
          >
            <Checkbox.HiddenInput
              aria-label={`Select all case types in ${pa.name}`}
            />
            <Checkbox.Control cursor="pointer" />
          </Checkbox.Root>
          <Flex align="center" gap={2} minW={0} wrap="wrap" flex="1">
            <Text
              fontSize="13px"
              fontWeight="600"
              color="fg.default"
              lineHeight="1.35"
              wordBreak="break-word"
            >
              {pa.name}
            </Text>
            <Text
              fontSize="11px"
              color="fg.subtle"
              whiteSpace="nowrap"
              flexShrink={0}
            >
              {selectedCount} of {leafIds.length} selected
            </Text>
          </Flex>
          <IconButton
            aria-label={`Remove ${pa.name}`}
            variant="outline"
            size="xs"
            color="fg.muted"
            cursor="pointer"
            flexShrink={0}
            onClick={handleRemove}
          >
            {REMOVE_ICON}
          </IconButton>
        </Flex>

        {subcategories.length === 0 ? (
          <Text fontSize="12px" color="fg.muted" textAlign="center" py="10px">
            No case types match "{query}"
          </Text>
        ) : (
          <ScrollArea.Root size="sm" maxHeight="240px" w="full">
            <ScrollArea.Viewport>
              {/* Padding lives on the content so hover fills, focus rings and
                  the scrollbar never clip a row as it scrolls past. The
                  checkbox's ring sits 2px outside the control and is 2px wide,
                  so the left and vertical padding has to clear ~4px — 2px left
                  a sliver of it cut off against the viewport edge. */}
              <ScrollArea.Content pl="6px" py="6px" pr="14px">
                <Stack gap="0">
                  {subcategories.map(({ sub, matches }) => (
                    <SubcategoryGroup
                      key={sub.id}
                      subcategory={sub}
                      caseTypes={matches}
                      selectedIds={selectedIds}
                      // While searching, show every matching group opened.
                      expanded={!!query || expandedIds.has(sub.id)}
                      onToggleExpanded={toggleExpanded}
                      onToggleCaseType={onToggleCaseType}
                      onSetGroupSelection={onSetGroupSelection}
                    />
                  ))}
                </Stack>
              </ScrollArea.Content>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar>
              <ScrollArea.Thumb />
            </ScrollArea.Scrollbar>
            <ScrollArea.Corner />
          </ScrollArea.Root>
        )}
      </Box>
      {showValidation && selectedCount === 0 && (
        <Text fontSize="12px" color="fg.error">
          Select at least one case type
        </Text>
      )}
    </Stack>
  );
},
(prev, next) =>
  prev.practiceArea === next.practiceArea &&
  prev.query === next.query &&
  prev.showValidation === next.showValidation &&
  prev.onToggleCaseType === next.onToggleCaseType &&
  prev.onSetGroupSelection === next.onSetGroupSelection &&
  prev.onRemovePracticeArea === next.onRemovePracticeArea &&
  sameSelection(
    leafIdsOf(prev.practiceArea),
    prev.selectedIds,
    next.selectedIds,
  ));

interface SubcategoryGroupProps {
  subcategory: PracticeAreaTreeNode;
  caseTypes: PracticeAreaTreeNode[];
  selectedIds: Set<string>;
  expanded: boolean;
  onToggleExpanded: (subcategoryId: string) => void;
  onToggleCaseType: (id: string) => void;
  onSetGroupSelection: (ids: string[], checked: boolean) => void;
}

const SubcategoryGroup = memo(function SubcategoryGroup({
  subcategory: sub,
  caseTypes,
  selectedIds,
  expanded,
  onToggleExpanded,
  onToggleCaseType,
  onSetGroupSelection,
}: SubcategoryGroupProps) {
  const ids = useMemo(() => caseTypes.map((ct) => ct.id), [caseTypes]);
  const selectedCount = countSelected(ids, selectedIds);
  const allSelected = ids.length > 0 && selectedCount === ids.length;

  const handleToggleExpanded = useCallback(
    () => onToggleExpanded(sub.id),
    [onToggleExpanded, sub.id],
  );

  const handleToggleAll = useCallback(
    () => onSetGroupSelection(ids, !allSelected),
    [onSetGroupSelection, ids, allSelected],
  );

  return (
    // A plain conditional rather than Collapsible: one row per subcategory is
    // cheap, but a state machine per row across ~60 rows is not, and the rows
    // have no enter/exit animation to preserve.
    <Stack gap="0">
      <Flex align="flex-start" gap="6px" py="2px">
        {/* Only the control selects the whole subcategory — the name beside it
            is the expand trigger, so a stray click on the row can't select 20
            case types at once. */}
        <Checkbox.Root
          size="sm"
          colorPalette="brand"
          checked={
            allSelected ? true : selectedCount > 0 ? "indeterminate" : false
          }
          onCheckedChange={handleToggleAll}
          cursor="pointer"
          flexShrink={0}
          mt="7px"
        >
          <Checkbox.HiddenInput
            aria-label={`Select all case types in ${sub.name}`}
          />
          <Checkbox.Control cursor="pointer" />
        </Checkbox.Root>

        {/* h="auto" because Chakra's button sizes are fixed-height and would
            clip a name that needs a second line. */}
        <Button
          variant="ghost"
          size="xs"
          flex="1"
          minW={0}
          h="auto"
          minH="28px"
          py="4px"
          justifyContent="flex-start"
          alignItems="flex-start"
          gap="6px"
          px="4px"
          fontSize="13px"
          fontWeight="500"
          color="fg.default"
          cursor="pointer"
          whiteSpace="normal"
          textAlign="left"
          aria-expanded={expanded}
          onClick={handleToggleExpanded}
        >
          <Box as="span" mt="2px" display="flex">
            {expanded ? CHEVRON_DOWN : CHEVRON_RIGHT}
          </Box>
          <Text flex="1" minW={0} lineHeight="1.35" wordBreak="break-word">
            {sub.name}
          </Text>
          <Text
            fontSize="11px"
            fontWeight="400"
            color="fg.subtle"
            lineHeight="1.35"
            whiteSpace="nowrap"
            flexShrink={0}
          >
            {selectedCount}/{ids.length}
          </Text>
        </Button>
      </Flex>

      {expanded && (
        <Stack gap="0" pl="26px" pb="4px">
          {caseTypes.map((ct) => (
            <CaseTypeRow
              key={ct.id}
              id={ct.id}
              name={ct.name}
              checked={selectedIds.has(ct.id)}
              onToggle={onToggleCaseType}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
},
(prev, next) => {
  if (
    prev.subcategory !== next.subcategory ||
    prev.caseTypes !== next.caseTypes ||
    prev.expanded !== next.expanded ||
    prev.onToggleExpanded !== next.onToggleExpanded ||
    prev.onToggleCaseType !== next.onToggleCaseType ||
    prev.onSetGroupSelection !== next.onSetGroupSelection
  ) {
    return false;
  }
  for (const ct of prev.caseTypes) {
    if (prev.selectedIds.has(ct.id) !== next.selectedIds.has(ct.id)) {
      return false;
    }
  }
  return true;
});

interface CaseTypeRowProps {
  id: string;
  name: string;
  checked: boolean;
  onToggle: (id: string) => void;
}

const CaseTypeRow = memo(function CaseTypeRow({
  id,
  name,
  checked,
  onToggle,
}: CaseTypeRowProps) {
  return (
    <Checkbox.Root
      size="sm"
      colorPalette="brand"
      checked={checked}
      onCheckedChange={() => onToggle(id)}
      // Long case-type names have to wrap rather than overflow the panel, so
      // the box aligns to the first line instead of centring on the block.
      alignItems="flex-start"
      cursor="pointer"
      gap="8px"
      py="4px"
      px="4px"
      borderRadius="sm"
      // `bg.hover`, not `bg.muted`: the latter is #303030 in dark mode and
      // barely separates from the panel this row sits on.
      _hover={{ bg: "bg.hover" }}
    >
      <Checkbox.HiddenInput />
      <Checkbox.Control cursor="pointer" flexShrink={0} mt="1px" />
      <Checkbox.Label
        display="flex"
        alignItems="flex-start"
        cursor="pointer"
        gap="6px"
        fontSize="13px"
        fontWeight="400"
        color="fg.default"
        lineHeight="1.35"
        whiteSpace="normal"
        wordBreak="break-word"
      >
        {CASE_TYPE_ICON}
        {name}
      </Checkbox.Label>
    </Checkbox.Root>
  );
});
