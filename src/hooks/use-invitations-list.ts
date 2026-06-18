import {
  getInvitations,
  type GetInvitationsParams,
  type InvitationCounts,
  type InvitationDTO,
  type PaginationMeta,
} from "@/api/organization";
import { useQuery } from "@tanstack/react-query";

export interface UseInvitationsListResult {
  data: InvitationDTO[];
  counts: InvitationCounts;
  pagination: PaginationMeta;
  isLoading: boolean;
}

export function useInvitationsList(
  params?: GetInvitationsParams,
): UseInvitationsListResult {
  const { data, isLoading } = useQuery({
    queryKey: ["invitations", params],
    queryFn: () => getInvitations(params),
    staleTime: Infinity,
  });

  return {
    data: data?.data ?? [],
    counts: data?.counts ?? {
      pending: 0,
      accepted: 0,
      rejected: 0,
      canceled: 0,
    },
    pagination: data?.pagination ?? {
      total: 0,
      limit: params?.limit ?? 10,
      offset: 0,
    },
    isLoading,
  };
}

export type { InvitationDTO, InvitationCounts, GetInvitationsParams };
