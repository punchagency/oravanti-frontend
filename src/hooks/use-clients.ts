import { getAllClients } from "@/api/clients";
import { useQuery } from "@tanstack/react-query";

export function useClients(search?: string) {
  return useQuery({
    queryKey: ["clients", search],
    queryFn: () => getAllClients(search),
    staleTime: Infinity,
  });
}
