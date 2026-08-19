import type { PracticeAreaTreeNode } from "@/api/auth";
import {
  buildNameLookup,
  usePracticeAreaSubtrees,
} from "@/hooks/use-practice-area-tree-data";
import type { StaffMemberDTO } from "@/hooks/use-staff-list";
import {
  Box,
  createTreeCollection,
  Flex,
  HStack,
  ScrollArea,
  Separator,
  Stack,
  Tag,
  Text,
  TreeView,
  VStack,
} from "@chakra-ui/react";
import { ChevronRight, FileText, FolderOpen } from "lucide-react";
import { useMemo } from "react";
import type { CreateTeamFormValues } from "./types";

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

function getPracticeAreasFromCaseTypeIds(
  nodes: PracticeAreaTreeNode[],
  selectedIds: Set<string>,
): PracticeAreaTreeNode[] {
  const result: PracticeAreaTreeNode[] = [];
  for (const pa of nodes) {
    const leafIds = collectLeafIds(pa.children ?? []);
    if (!leafIds.some((id) => selectedIds.has(id))) continue;
    const filteredChildren = filterChildren(pa.children ?? [], selectedIds);
    result.push({
      ...pa,
      children: filteredChildren.length > 0 ? filteredChildren : [],
    });
  }
  return result;
}

function filterChildren(
  nodes: PracticeAreaTreeNode[],
  selectedIds: Set<string>,
): PracticeAreaTreeNode[] {
  const result: PracticeAreaTreeNode[] = [];
  for (const node of nodes) {
    if (!node.children || node.children.length === 0) {
      if (selectedIds.has(node.id)) {
        result.push(node);
      }
    } else {
      const filtered = filterChildren(node.children, selectedIds);
      if (filtered.length > 0) {
        result.push({ ...node, children: filtered });
      }
    }
  }
  return result;
}

export function StepReview({
  formValues,
  allStaff,
  leadName,
  selectedIds,
}: {
  formValues: CreateTeamFormValues;
  allStaff: StaffMemberDTO[];
  leadName: string | null;
  selectedIds: string[];
}) {
  /*
    The same per-practice-area subtree queries CaseTypeSelect used on step one.
    They are keyed by practice-area id with `staleTime: Infinity`, so reaching
    this step costs no request at all — the cache already holds every subtree
    the user selected from, and only those.
  */
  const { nodes: practiceAreaTreeNodes } = usePracticeAreaSubtrees(
    formValues.practiceAreas,
  );

  // Derived here rather than shipped by the API, which used to duplicate every
  // name in the tree a second time just to provide this map.
  const practiceAreaNameLookup = useMemo(
    () => buildNameLookup(practiceAreaTreeNodes),
    [practiceAreaTreeNodes],
  );

  const idSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedPracticeAreas = useMemo(
    () => getPracticeAreasFromCaseTypeIds(practiceAreaTreeNodes, idSet),
    [practiceAreaTreeNodes, idSet],
  );

  return (
    <VStack align="stretch" gap="20px">
      <Stack
        bg="bg.muted"
        p={{ base: "16px", sm: "20px" }}
        borderRadius="12px"
        border="1px solid"
        borderColor="border.muted"
        gap="0"
      >
        <Flex
          justify="space-between"
          align="center"
          py="14px"
          _first={{ pt: "4px" }}
        >
          <Text
            fontSize="11px"
            fontWeight="700"
            color="fg.subtle"
            letterSpacing="0.05em"
          >
            TEAM NAME
          </Text>
          <Text fontSize="14px" fontWeight="700" color="fg.default">
            {formValues.teamName || "\u2014"}
          </Text>
        </Flex>

        {formValues.description && (
          <>
            <Separator borderColor="border.muted" />
            <Flex justify="space-between" align="center" py="14px">
              <Text
                fontSize="11px"
                fontWeight="700"
                color="fg.subtle"
                letterSpacing="0.05em"
              >
                DESCRIPTION
              </Text>
              <Text
                fontSize="13px"
                color="fg.muted"
                textAlign="right"
                maxW="60%"
              >
                {formValues.description}
              </Text>
            </Flex>
          </>
        )}

        <Separator borderColor="border.muted" />

        <Flex justify="space-between" align="center" py="14px">
          <Text
            fontSize="11px"
            fontWeight="700"
            color="fg.subtle"
            letterSpacing="0.05em"
          >
            PRACTICE AREAS
          </Text>
          <HStack gap="6px" flexWrap="wrap" justifyContent="flex-end">
            {selectedPracticeAreas.length > 0 ? (
              selectedPracticeAreas.map((pa) => (
                <Tag.Root
                  key={pa.id}
                  colorPalette="brand"
                  variant="subtle"
                  size="sm"
                >
                  <Tag.Label>{pa.name}</Tag.Label>
                </Tag.Root>
              ))
            ) : (
              <Text fontSize="14px" color="fg.subtle">
                \u2014
              </Text>
            )}
          </HStack>
        </Flex>

        {selectedPracticeAreas.length > 0 && (
          <>
            <Separator borderColor="border.muted" />
            <Stack py="14px" gap="12px">
              <Text
                fontSize="11px"
                fontWeight="700"
                color="fg.subtle"
                letterSpacing="0.05em"
              >
                SELECTED PRACTICE AREAS
              </Text>
              <ScrollArea.Root maxHeight="240px">
                <ScrollArea.Viewport>
                  <ScrollArea.Content>
                    <Stack gap="8px">
                      {selectedPracticeAreas.map((pa) => (
                        <PracticeAreaTreeViewer
                          key={pa.id}
                          practiceArea={pa}
                          nameLookup={practiceAreaNameLookup}
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
            </Stack>
          </>
        )}

        <Separator borderColor="border.muted" />

        <Flex justify="space-between" align="center" py="14px">
          <Text
            fontSize="11px"
            fontWeight="700"
            color="fg.subtle"
            letterSpacing="0.05em"
          >
            TEAM LEAD
          </Text>
          <Text fontSize="14px" fontWeight="700" color="fg.default">
            {leadName || "Not Set"}
          </Text>
        </Flex>

        <Separator borderColor="border.muted" />

        <Flex justify="space-between" align="center" py="14px">
          <Text
            fontSize="11px"
            fontWeight="700"
            color="fg.subtle"
            letterSpacing="0.05em"
          >
            MAX CASELOAD
          </Text>
          <Text fontSize="14px" fontWeight="700" color="fg.default">
            {formValues.maxCaseload || "0"} cases
          </Text>
        </Flex>

        <Separator borderColor="border.muted" />

        <Stack gap="6px" py="14px" _last={{ pb: "4px" }}>
          <Text
            fontSize="11px"
            fontWeight="700"
            color="fg.subtle"
            letterSpacing="0.05em"
          >
            MEMBERS ({formValues.memberIds?.length || 0} STAFF)
          </Text>
          <Text fontSize="13px" color="fg.muted">
            {formValues.memberIds?.length > 0
              ? formValues.memberIds
                  .map((id) => {
                    const staffMember = allStaff.find(
                      (member) => member.id === id,
                    );
                    return staffMember
                      ? `${staffMember.firstName} ${staffMember.lastName}`
                      : null;
                  })
                  .filter(Boolean)
                  .join(", ")
              : "None selected"}
          </Text>
        </Stack>
      </Stack>

      <HStack gap="8px" align="start" px="4px">
        <Text fontSize="13px" color="fg.subtle" mt="1px">
          \u24d8
        </Text>
        <Text fontSize="12px" color="fg.subtle" lineHeight="1.5">
          The team lead will be notified. Each member's individual caseload cap
          still applies.
        </Text>
      </HStack>
    </VStack>
  );
}

function PracticeAreaTreeViewer({
  practiceArea: pa,
  nameLookup,
}: {
  practiceArea: PracticeAreaTreeNode;
  nameLookup: Record<string, string>;
}) {
  const collection = useMemo(
    () =>
      createTreeCollection<PracticeAreaTreeNode>({
        nodeToValue: (n) => n.id,
        nodeToString: (n) => nameLookup[n.id] ?? n.name,
        nodeToChildren: (n) => n.children ?? [],
        rootNode: pa,
      }),
    [pa, nameLookup],
  );

  return (
    <Box>
      <Text fontSize="13px" fontWeight="600" color="fg.default" mb="6px">
        {pa.name}
      </Text>
      <Box
        borderWidth="1px"
        borderColor="border.muted"
        borderRadius="md"
        p={3}
      >
        <TreeView.Root collection={collection} defaultExpandedValue={[pa.id]}>
          <TreeView.Tree p="6px">
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
        </TreeView.Root>
      </Box>
    </Box>
  );
}
