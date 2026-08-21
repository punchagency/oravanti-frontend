import { getUserSessions } from "@/api/auth";
import { useQuery } from "@tanstack/react-query";

export function useUserSessions() {
  return useQuery({
    queryKey: ["userSessions"],
    queryFn: getUserSessions,
  });
}
