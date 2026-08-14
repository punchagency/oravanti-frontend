import type { PracticeAreaTreeNode } from "@/api/auth";
import { leafIdsOf } from "@/utils/practice-area-tree";
import {
  Checkmark,
  createTreeCollection,
  Field,
  Flex,
  IconButton,
  ScrollArea,
  Text,
  TreeView,
  useTreeViewNodeContext,
} from "@chakra-ui/react";
import { ChevronRight, FileText, Folder, X } from "lucide-react";
import { memo, useCallback, useLayoutEffect, useMemo, useRef } from "react";

interface PracticeAreaTreeViewProps {
  practiceAreaTreeNodes: PracticeAreaTreeNode[];
  selectedPracticeAreaIds: string[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onRemovePracticeArea: (practiceAreaId: string) => void;
}

// Hoisted so every node reuses the same element/object identity. React bails
// out of re-rendering a child whose element is referentially identical, which
// matters here: the taxonomy runs to ~90 nodes per practice area.
const INDENT_GUIDE = <TreeView.BranchIndentGuide />;
const CHEVRON_ICON = <ChevronRight />;
const FOLDER_ICON = <Folder size={14} />;
const FILE_ICON = <FileText size={14} />;
const REMOVE_ICON = <X />;
const CHECKMARK_BG = {
  base: "bg",
  _checked: "colorPalette.solid",
  _indeterminate: "colorPalette.solid",
};

// Chakra's tree-view recipe hovers rows to `bg.muted`, which this theme resolves
// to #303030 in dark mode — all but invisible against the #2A2A2A panel the tree
// sits on. `bg.hover` is the theme's own hover surface and separates in both modes.
const NODE_HOVER = { bg: "bg.hover" };

function sameIds(a: string[], b: string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function SubtreeCheckbox() {
  const nodeState = useTreeViewNodeContext();
  return (
    <TreeView.NodeCheckbox aria-label="check node">
      <Checkmark
        bg={CHECKMARK_BG}
        size="sm"
        checked={nodeState.checked === true}
        indeterminate={nodeState.checked === "indeterminate"}
      />
    </TreeView.NodeCheckbox>
  );
}

export function PracticeAreaTreeView({
  practiceAreaTreeNodes,
  selectedPracticeAreaIds,
  selectedIds,
  onSelectionChange,
  onRemovePracticeArea,
}: PracticeAreaTreeViewProps) {
  // Callers build these inline inside a react-hook-form `Controller`, so they
  // get a fresh identity on every render. Route them through refs to hand the
  // memoized subtrees callbacks that never change identity.
  const selectedIdsRef = useRef(selectedIds);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const onRemovePracticeAreaRef = useRef(onRemovePracticeArea);
  useLayoutEffect(() => {
    selectedIdsRef.current = selectedIds;
    onSelectionChangeRef.current = onSelectionChange;
    onRemovePracticeAreaRef.current = onRemovePracticeArea;
  });

  const applySubtreeChange = useCallback(
    (leafIdSet: Set<string>, newLeafIds: string[]) => {
      onSelectionChangeRef.current([
        ...selectedIdsRef.current.filter((id) => !leafIdSet.has(id)),
        ...newLeafIds,
      ]);
    },
    [],
  );

  const handleRemove = useCallback((practiceAreaId: string) => {
    onRemovePracticeAreaRef.current(practiceAreaId);
  }, []);

  const subtrees = useMemo(() => {
    const visible = new Set(selectedPracticeAreaIds);
    const selected = new Set(selectedIds);
    return practiceAreaTreeNodes
      .filter((pa) => visible.has(pa.id))
      .map((pa) => {
        const leafIds = leafIdsOf(pa);
        return {
          practiceArea: pa,
          leafIds,
          checkedValue: leafIds.filter((id) => selected.has(id)),
        };
      });
  }, [practiceAreaTreeNodes, selectedPracticeAreaIds, selectedIds]);

  return subtrees.map(({ practiceArea, leafIds, checkedValue }) => (
    <PracticeAreaSubtree
      key={practiceArea.id}
      practiceArea={practiceArea}
      leafIds={leafIds}
      checkedValue={checkedValue}
      onSubtreeChange={applySubtreeChange}
      onRemove={handleRemove}
    />
  ));
}

interface PracticeAreaSubtreeProps {
  practiceArea: PracticeAreaTreeNode;
  leafIds: string[];
  checkedValue: string[];
  onSubtreeChange: (leafIdSet: Set<string>, newLeafIds: string[]) => void;
  onRemove: (practiceAreaId: string) => void;
}

const PracticeAreaSubtree = memo(
  function PracticeAreaSubtree({
    practiceArea: pa,
    leafIds,
    checkedValue,
    onSubtreeChange,
    onRemove,
  }: PracticeAreaSubtreeProps) {
    const leafIdSet = useMemo(() => new Set(leafIds), [leafIds]);
    const hasSelections = checkedValue.length > 0;

    // A fresh collection identity makes TreeView re-index the whole subtree, so
    // keep it tied to the node itself rather than rebuilding it every render.
    const subtreeCollection = useMemo(
      () =>
        createTreeCollection<PracticeAreaTreeNode>({
          nodeToValue: (node) => node.id,
          nodeToString: (node) => node.name,
          nodeToChildren: (node) => node.children ?? [],
          rootNode: pa,
        }),
      [pa],
    );

    const handleSubtreeChange = useCallback(
      (details: { checkedValue: string[] | undefined }) => {
        const checkedValues = details.checkedValue ?? [];
        const newLeafIds = checkedValues.includes(pa.id)
          ? leafIds
          : checkedValues.filter((id) => id !== pa.id && leafIdSet.has(id));
        onSubtreeChange(leafIdSet, newLeafIds);
      },
      [pa.id, leafIds, leafIdSet, onSubtreeChange],
    );

    const handleRemove = useCallback(() => onRemove(pa.id), [onRemove, pa.id]);

    const renderNode = useCallback(
      ({
        nodeState,
        node,
      }: {
        nodeState: { isBranch: boolean };
        node: PracticeAreaTreeNode;
      }) =>
        node.id === pa.id ? (
          <Flex align="center" justify="space-between" w="full" pr="1">
            <TreeView.BranchControl role="none" flex="1" _hover={NODE_HOVER}>
              <TreeView.BranchIndicator>{CHEVRON_ICON}</TreeView.BranchIndicator>
              <SubtreeCheckbox />
              {FOLDER_ICON}
              <TreeView.BranchText fontSize="sm">
                {node.name}
              </TreeView.BranchText>
            </TreeView.BranchControl>
            <IconButton
              aria-label={`Remove ${pa.name}`}
              variant="ghost"
              size="xs"
              color="fg.muted"
              onClick={handleRemove}
            >
              {REMOVE_ICON}
            </IconButton>
          </Flex>
        ) : nodeState.isBranch ? (
          <TreeView.BranchControl role="none" _hover={NODE_HOVER}>
            <TreeView.BranchIndicator>{CHEVRON_ICON}</TreeView.BranchIndicator>
            <SubtreeCheckbox />
            {FOLDER_ICON}
            <TreeView.BranchText fontSize="sm">{node.name}</TreeView.BranchText>
          </TreeView.BranchControl>
        ) : (
          <TreeView.Item _hover={NODE_HOVER}>
            <SubtreeCheckbox />
            {FILE_ICON}
            <TreeView.ItemText fontSize="sm">{node.name}</TreeView.ItemText>
          </TreeView.Item>
        ),
      [pa.id, pa.name, handleRemove],
    );

    return (
      <Field.Root mt="8px" invalid={!hasSelections}>
        <TreeView.Root
          collection={subtreeCollection}
          checkedValue={checkedValue}
          onCheckedChange={handleSubtreeChange}
          lazyMount
          unmountOnExit
          borderWidth="1px"
          borderColor="border.muted"
          borderRadius="md"
          p={3}
        >
          <Flex align="center" justify="space-between" mb="2px" w={"full"}>
            <Text fontSize="13px" fontWeight="600" color="fg.default">
              {pa.name}
            </Text>
            <IconButton
              aria-label={`Remove ${pa.name}`}
              variant="outline"
              size="xs"
              color="fg.muted"
              onClick={handleRemove}
            >
              {REMOVE_ICON}
            </IconButton>
          </Flex>{" "}
          <ScrollArea.Root maxHeight="200px">
            <ScrollArea.Viewport>
              <ScrollArea.Content>
                <TreeView.Tree p="8px">
                  <TreeView.Node
                    indentGuide={INDENT_GUIDE}
                    render={renderNode}
                  />
                </TreeView.Tree>
              </ScrollArea.Content>
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar>
              <ScrollArea.Thumb />
            </ScrollArea.Scrollbar>
            <ScrollArea.Corner />
          </ScrollArea.Root>
        </TreeView.Root>
        {!hasSelections && (
          <Field.ErrorText>
            Select at least one subcategory or case type
          </Field.ErrorText>
        )}
      </Field.Root>
    );
  },
  (prev, next) =>
    prev.practiceArea === next.practiceArea &&
    prev.leafIds === next.leafIds &&
    prev.onSubtreeChange === next.onSubtreeChange &&
    prev.onRemove === next.onRemove &&
    sameIds(prev.checkedValue, next.checkedValue),
);
