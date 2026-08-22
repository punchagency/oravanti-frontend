import {
  addMemberToGroup,
  createRoleGroup,
  deleteRoleGroup,
  getRoleGroup,
  getRoleGroupMemberships,
  getRoleGroups,
  removeMemberFromGroup,
  updateRoleGroup,
  type RoleGroupsQuery,
} from "@/api/role-groups";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useFeedbackDialog } from "./useFeedbackDialog";

function useInvalidateGroupQueries() {
  const queryClient = useQueryClient();
  return () => {
    // Covers both ["role-groups"] (the group list) and
    // ["role-groups", "memberships"] / ["role-groups", groupId].
    queryClient.invalidateQueries({ queryKey: ["role-groups"] });
    queryClient.invalidateQueries({ queryKey: ["roles"] });
    queryClient.invalidateQueries({ queryKey: ["permissions-matrix"] });
  };
}

/**
 * Server-side search + pagination. Called with no params by pickers that
 * need the full list; the tab passes q/page/limit.
 */
export function useRoleGroups(params: RoleGroupsQuery = {}) {
  return useQuery({
    queryKey: ["role-groups", params],
    queryFn: () => getRoleGroups(params),
  });
}

export function useRoleGroup(groupId: string | null) {
  return useQuery({
    queryKey: ["role-groups", groupId],
    queryFn: () => getRoleGroup(groupId!),
    enabled: !!groupId,
  });
}

/**
 * Returns a `Record<memberId, string[]>` mapping each staff member to the
 * group names they belong to, via one bulk memberships query rather than a
 * per-group fan-out.
 */
export function useStaffGroupsMap() {
  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ["role-groups", "memberships"],
    queryFn: getRoleGroupMemberships,
  });

  const groupsByMember = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const { memberId, groupName } of memberships) {
      (map[memberId] ??= []).push(groupName);
    }
    return map;
  }, [memberships]);

  return { groupsByMember, isLoading };
}

export function useCreateRoleGroup() {
  const { showSuccess, showError } = useFeedbackDialog();
  const invalidate = useInvalidateGroupQueries();

  return useMutation({
    mutationFn: (data: { name: string; description?: string; roles: string[] }) =>
      createRoleGroup(data),
    onSuccess: () => {
      showSuccess({ title: "Role group created" });
      invalidate();
    },
    onError: (error) => {
      showError({
        title: "Failed to create role group",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}

export function useUpdateRoleGroup() {
  const { showSuccess, showError } = useFeedbackDialog();
  const invalidate = useInvalidateGroupQueries();

  return useMutation({
    mutationFn: ({
      groupId,
      ...data
    }: {
      groupId: string;
      name?: string;
      description?: string;
      roles?: string[];
    }) => updateRoleGroup(groupId, data),
    onSuccess: () => {
      showSuccess({ title: "Role group updated" });
      invalidate();
    },
    onError: (error) => {
      showError({
        title: "Failed to update role group",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}

export function useDeleteRoleGroup() {
  const { showSuccess, showError } = useFeedbackDialog();
  const invalidate = useInvalidateGroupQueries();

  return useMutation({
    mutationFn: (groupId: string) => deleteRoleGroup(groupId),
    onSuccess: () => {
      showSuccess({ title: "Role group deleted" });
      invalidate();
    },
    onError: (error) => {
      showError({
        title: "Failed to delete role group",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}

export function useAddGroupMember() {
  const { showError } = useFeedbackDialog();
  const invalidate = useInvalidateGroupQueries();

  return useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: string; memberId: string }) =>
      addMemberToGroup(groupId, memberId),
    onSuccess: () => {
      invalidate();
    },
    onError: (error) => {
      showError({
        title: "Failed to add member",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}

export function useRemoveGroupMember() {
  const { showError } = useFeedbackDialog();
  const invalidate = useInvalidateGroupQueries();

  return useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: string; memberId: string }) =>
      removeMemberFromGroup(groupId, memberId),
    onSuccess: () => {
      invalidate();
    },
    onError: (error) => {
      showError({
        title: "Failed to remove member",
        description: getErrorMessage(error, "Please try again."),
      });
    },
  });
}
