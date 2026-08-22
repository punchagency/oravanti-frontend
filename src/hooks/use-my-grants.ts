import { getMyGrants } from "@/api/roles-permissions";
import { useQuery } from "@tanstack/react-query";

/**
 * A fresher read of the caller's own grants than the session's cached copy
 * (`useAuthStore().grants`, refreshed on the ~30s session query interval).
 * Use this when a permission change needs to reflect immediately — e.g.
 * right after editing a role you hold — rather than `useHasPermission`.
 */
export function useMyGrants() {
  return useQuery<string[]>({
    queryKey: ["my-grants"],
    queryFn: getMyGrants,
  });
}
