import { getPermissionsMatrix, type PermissionsMatrix } from "@/api/roles-permissions";
import { useQuery } from "@tanstack/react-query";

export function usePermissionsMatrix() {
  return useQuery<PermissionsMatrix>({
    queryKey: ["permissions-matrix"],
    queryFn: getPermissionsMatrix,
    staleTime: Infinity,
  });
}
