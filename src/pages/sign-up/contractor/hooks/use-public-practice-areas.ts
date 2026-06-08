import { getPublicPracticeAreas } from "@/api/auth";
import { useQuery } from "@tanstack/react-query";

export function usePublicPracticeAreas() {
  return useQuery({
    queryKey: ["public-practice-areas"],
    queryFn: getPublicPracticeAreas,
  });
}
