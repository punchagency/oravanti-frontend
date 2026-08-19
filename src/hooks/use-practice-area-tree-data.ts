import {
  getPracticeAreaTreeData,
  type PracticeAreaTreeNode,
} from "@/api/auth";
import { useQueries, useQuery } from "@tanstack/react-query";

/**
 * The full taxonomy: ~750 nodes. Only viewers that render the whole tree should
 * ask for this — pickers that need names for the top level want
 * `usePracticeAreaList`, and pickers that need one practice area's case types
 * want `usePracticeAreaSubtrees`.
 */
export function usePracticeAreaTreeData() {
  return useQuery({
    queryKey: ["practice-area-tree-data", "full"],
    queryFn: () => getPracticeAreaTreeData(),
    staleTime: Infinity,
  });
}

/** Practice areas only (no subcategories or case types) — a few hundred bytes. */
export function usePracticeAreaList() {
  return useQuery({
    queryKey: ["practice-area-tree-data", "depth", 1],
    queryFn: () => getPracticeAreaTreeData({ depth: 1 }),
    staleTime: Infinity,
  });
}

const NO_NODES: PracticeAreaTreeNode[] = [];

/**
 * Subtrees for the given practice areas, fetched one request per area so that
 * every combination of selections reuses the same cache entries instead of
 * keying a fresh query on the whole set.
 */
export function usePracticeAreaSubtrees(practiceAreaIds: string[]) {
  return useQueries({
    queries: practiceAreaIds.map((id) => ({
      queryKey: ["practice-area-tree-data", "subtree", id],
      queryFn: () => getPracticeAreaTreeData({ practiceAreaIds: [id] }),
      staleTime: Infinity,
    })),
    // `combine` is re-run only when a result actually changes, so consumers get
    // a stable node array identity and don't re-render on every parent render.
    combine: (results) => {
      const nodes: PracticeAreaTreeNode[] = [];
      for (const result of results) {
        if (result.data) nodes.push(...result.data.practiceAreaTreeNodes);
      }
      return {
        nodes: nodes.length > 0 ? nodes : NO_NODES,
        isPending: results.some((result) => result.isPending),
      };
    },
  });
}

/**
 * Flattens a tree into an id → name map. The API used to ship this alongside
 * the tree, which duplicated every name on the wire for no benefit.
 */
export function buildNameLookup(nodes: PracticeAreaTreeNode[]) {
  const lookup: Record<string, string> = {};
  const walk = (list: PracticeAreaTreeNode[]) => {
    for (const node of list) {
      lookup[node.id] = node.name;
      if (node.children) walk(node.children);
    }
  };
  walk(nodes);
  return lookup;
}
