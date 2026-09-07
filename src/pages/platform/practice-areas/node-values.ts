import type { TaxonomyNodePatch } from "@/api/platform";

/**
 * The two fields every taxonomy node's form shares.
 *
 * Apart from `node.tsx` so that file exports components only and fast refresh
 * keeps working — the same split `use-paged-list.ts` makes for the same reason.
 */
export type NodeValues = { name: string; description: string };

/**
 * The patch an Edit dialog sends.
 *
 * An empty description goes as `null`, not `""`. The column is nullable and the
 * two mean different things: `""` is a description that happens to be blank,
 * `null` is the absence of one — and "No description yet" is rendered off the
 * second.
 */
export function nodePatch(values: NodeValues): TaxonomyNodePatch {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
  };
}
