import {
  getStaffs,
  type GetStaffsParams,
  type PaginationMeta,
  type StatusCounts,
} from "@/api/organization";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { useQuery } from "@tanstack/react-query";
import { useFeedbackDialog } from "./useFeedbackDialog";

export interface StaffMemberDTO {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  orgEmail: string | null;
  phone: string | null;
  role: string | null;
  memberId: string | null;
  status: string;
  jobTitle: string | null;
  barNumber: string | null;
  startDate: string | null;
  maxCaseload: number | null;
  avatarUrl: string | null;
  practiceAreas: { id: string; name: string }[];
  subcategories: { id: string; name: string }[];
  caseTypes: { id: string; name: string }[];
  teams: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
}

export function useStaffsList(params?: GetStaffsParams) {
  const { showError } = useFeedbackDialog();

  const query = useQuery({
    queryKey: ["staffs", params],
    queryFn: () => getStaffs(params),
    staleTime: Infinity,
  });

  if (query.isError) {
    showError({
      title: "Failed to load staff",
      description: getErrorMessage(query.error, "Please try again later."),
    });
  }

  return query;
}

export type { GetStaffsParams, PaginationMeta, StatusCounts };
