import { useHasPermission } from "@/hooks/use-has-permission";

/** Gates the document download control against the `documents:download` grant. */
export function useCanDownloadDocuments(): boolean {
  return useHasPermission("documents", "download");
}
