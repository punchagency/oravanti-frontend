import type { PracticeAreaTreeNode } from "@/api/auth";

/** Every case-type (leaf) id beneath the given nodes. */
export function collectLeafIds(nodes: PracticeAreaTreeNode[]): string[] {
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

// Tree nodes come from a `staleTime: Infinity` query, so their identity is
// stable for the life of the cache — walking a subtree once per node is enough.
const leafIdCache = new WeakMap<PracticeAreaTreeNode, string[]>();

/** `collectLeafIds` for a practice area's children, cached per node. */
export function leafIdsOf(practiceArea: PracticeAreaTreeNode): string[] {
  let ids = leafIdCache.get(practiceArea);
  if (!ids) {
    ids = collectLeafIds(practiceArea.children ?? []);
    leafIdCache.set(practiceArea, ids);
  }
  return ids;
}
