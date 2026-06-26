import type { PracticeAreaTreeNode } from "@/api/auth";
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

interface PracticeAreaTreeViewProps {
  practiceAreaTreeNodes: PracticeAreaTreeNode[];
  selectedPracticeAreaIds: string[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onRemovePracticeArea: (practiceAreaId: string) => void;
}

function collectLeafIds(nodes: PracticeAreaTreeNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) {
    if (!node.children || node.children.length === 0) {
      ids.push(node.id);
    } else {
      ids.push(...collectLeafIds(node.children));
    }
  }
  return ids;
}

function SubtreeCheckbox() {
  const nodeState = useTreeViewNodeContext();
  return (
    <TreeView.NodeCheckbox aria-label="check node">
      <Checkmark
        bg={{
          base: "bg",
          _checked: "colorPalette.solid",
          _indeterminate: "colorPalette.solid",
        }}
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
  const selectedPracticeAreaSet = new Set(selectedPracticeAreaIds);
  const visiblePracticeAreas = practiceAreaTreeNodes.filter((pa) =>
    selectedPracticeAreaSet.has(pa.id),
  );

  return visiblePracticeAreas.map((pa) => {
    const childNodes = pa.children ?? [];
    const leafIds = collectLeafIds(childNodes);
    const hasSelections = leafIds.some((id) => selectedIds.includes(id));

    const handleSubtreeChange = (details: {
      checkedValue: string[] | undefined;
    }) => {
      const checkedValues = details.checkedValue ?? [];
      const newLeafIds = checkedValues.includes(pa.id)
        ? leafIds
        : checkedValues.filter((id) => id !== pa.id && leafIds.includes(id));
      onSelectionChange([
        ...selectedIds.filter((id) => !leafIds.includes(id)),
        ...newLeafIds,
      ]);
    };

    const subtreeCollection = createTreeCollection<PracticeAreaTreeNode>({
      nodeToValue: (node) => node.id,
      nodeToString: (node) => node.name,
      nodeToChildren: (node) => node.children ?? [],
      rootNode: pa,
    });

    return (
      <Field.Root key={pa.id} mt="8px" invalid={!hasSelections}>
        <TreeView.Root
          collection={subtreeCollection}
          checkedValue={selectedIds.filter((id) => leafIds.includes(id))}
          onCheckedChange={handleSubtreeChange}
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
              onClick={() => onRemovePracticeArea(pa.id)}
            >
              <X />
            </IconButton>
          </Flex>{" "}
          <ScrollArea.Root maxHeight="200px">
            <ScrollArea.Viewport>
              <ScrollArea.Content>
                <TreeView.Tree p="8px">
                  <TreeView.Node
                    indentGuide={<TreeView.BranchIndentGuide />}
                    render={({ nodeState, node }) =>
                      node.id === pa.id ? (
                        <Flex
                          align="center"
                          justify="space-between"
                          w="full"
                          pr="1"
                        >
                          <TreeView.BranchControl role="none" flex="1">
                            <TreeView.BranchIndicator>
                              <ChevronRight />
                            </TreeView.BranchIndicator>
                            <SubtreeCheckbox />
                            <Folder size={14} />
                            <TreeView.BranchText fontSize="sm">
                              {node.name}
                            </TreeView.BranchText>
                          </TreeView.BranchControl>
                          <IconButton
                            aria-label={`Remove ${pa.name}`}
                            variant="ghost"
                            size="xs"
                            color="fg.muted"
                            onClick={() => onRemovePracticeArea(pa.id)}
                          >
                            <X />
                          </IconButton>
                        </Flex>
                      ) : nodeState.isBranch ? (
                        <TreeView.BranchControl role="none">
                          <TreeView.BranchIndicator>
                            <ChevronRight />
                          </TreeView.BranchIndicator>
                          <SubtreeCheckbox />
                          <Folder size={14} />
                          <TreeView.BranchText fontSize="sm">
                            {node.name}
                          </TreeView.BranchText>
                        </TreeView.BranchControl>
                      ) : (
                        <TreeView.Item>
                          <SubtreeCheckbox />
                          <FileText size={14} />
                          <TreeView.ItemText fontSize="sm">
                            {node.name}
                          </TreeView.ItemText>
                        </TreeView.Item>
                      )
                    }
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
  });
}
