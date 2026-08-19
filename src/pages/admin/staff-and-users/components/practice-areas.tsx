import type { PracticeAreaTreeNode } from "@/api/auth";
import { usePracticeAreaTreeData } from "@/hooks/use-practice-area-tree-data";
import {
  Box,
  createTreeCollection,
  ScrollArea,
  Stack,
  Text,
  TreeView,
} from "@chakra-ui/react";
import { ChevronRight, FileText, FolderOpen } from "lucide-react";
import { useMemo } from "react";

export interface PracticeAreaAssignee {
  practiceAreas: { id: string; name: string }[];
  subcategories: { id: string; name: string }[];
  caseTypes: { id: string; name: string }[];
}

export function PracticeAreas({
  assignee,
}: {
  assignee: PracticeAreaAssignee;
}) {
  const treeDataQuery = usePracticeAreaTreeData();
  const treeData = treeDataQuery.data;

  const assignedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const pa of assignee.practiceAreas) ids.add(pa.id);
    for (const sub of assignee.subcategories) ids.add(sub.id);
    for (const ct of assignee.caseTypes) ids.add(ct.id);
    return ids;
  }, [assignee]);

  const filteredTree = useMemo(() => {
    if (!treeData?.practiceAreaTreeNodes) return [];
    const subIds = new Set(assignee.subcategories.map((s) => s.id));
    return filterTree(treeData.practiceAreaTreeNodes, assignedIds, subIds);
  }, [treeData, assignedIds, assignee.subcategories]);

  if (filteredTree.length === 0) {
    return (
      <Box pb={5}>
        <Text color="fg.muted" fontSize="12px" textAlign="center" py={8}>
          No practice areas assigned.
        </Text>
      </Box>
    );
  }

  return (
    <ScrollArea.Root maxHeight={"calc(100vh - 300px)"} size={"sm"}>
      <ScrollArea.Viewport>
        <ScrollArea.Content>
          <Stack pb={5} gap={3}>
            {filteredTree.map((pa) => (
              <PracticeAreaTreeViewer
                key={pa.id}
                practiceArea={pa}
                assignedIds={assignedIds}
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
  );
}

function filterTree(
  nodes: PracticeAreaTreeNode[],
  ids: Set<string>,
  subIds: Set<string>,
  depth = 0,
): PracticeAreaTreeNode[] {
  const result: PracticeAreaTreeNode[] = [];
  for (const node of nodes) {
    if (depth === 0 && !ids.has(node.id)) continue;
    if (depth === 1 && !subIds.has(node.id)) continue;
    const filtered = node.children
      ? filterTree(node.children, ids, subIds, depth + 1)
      : undefined;
    result.push({
      ...node,
      children: filtered && filtered.length > 0 ? filtered : undefined,
    });
  }
  return result;
}

function PracticeAreaTreeViewer({
  practiceArea: pa,
  assignedIds,
}: {
  practiceArea: PracticeAreaTreeNode;
  assignedIds: Set<string>;
}) {
  const collection = useMemo(
    () =>
      createTreeCollection<PracticeAreaTreeNode>({
        nodeToValue: (n) => n.id,
        nodeToString: (n) => n.name,
        nodeToChildren: (n) =>
          (n.children ?? []).filter((c) => assignedIds.has(c.id)),
        rootNode: pa,
      }),
    [pa, assignedIds],
  );

  return (
    <Box>
      <Text fontSize="13px" fontWeight="600" color="fg.default" mb="6px">
        {pa.name}
      </Text>
      <TreeView.Root
        collection={collection}
        lazyMount
        unmountOnExit
        borderWidth="1px"
        borderColor="border.muted"
        borderRadius="md"
        p={2}
        defaultExpandedValue={[pa.id]}
      >
        <ScrollArea.Root maxHeight="200px" size={"sm"}>
          <ScrollArea.Viewport>
            <ScrollArea.Content>
              <TreeView.Tree>
                <TreeView.Node
                  indentGuide={<TreeView.BranchIndentGuide />}
                  render={({ nodeState, node }) =>
                    nodeState.isBranch ? (
                      <TreeView.BranchControl role="none">
                        <TreeView.BranchIndicator>
                          <ChevronRight />
                        </TreeView.BranchIndicator>
                        <FolderOpen size={14} />
                        <TreeView.BranchText fontSize="sm" ml={1}>
                          {node.name}
                        </TreeView.BranchText>
                      </TreeView.BranchControl>
                    ) : (
                      <TreeView.Item>
                        <FileText size={14} />
                        <TreeView.ItemText fontSize="sm" ml={2}>
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
    </Box>
  );
}
