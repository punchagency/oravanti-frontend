import {
  getStaffList,
  type GetStaffListParams,
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
  status: string;
  jobTitle: string | null;
  startDate: string | null;
  maxCaseload: number | null;
  practiceAreas: string[];
  team: string;
  createdAt: string;
  updatedAt: string;
}

export function useStaffList(params?: GetStaffListParams) {
  const { showError } = useFeedbackDialog();

  const query = useQuery({
    queryKey: ["staff", params],
    queryFn: () => getStaffList(params),
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

export type { GetStaffListParams, PaginationMeta, StatusCounts };
