import { useQuery } from "@tanstack/react-query";
import { getStaffs } from "@/api/staff";
import type { StaffCertification } from "./types";

export {
  useCaseWorkflow,
  useWorkflowSummary,
  useCaseTimeline,
  useAssignStep,
  useCompleteStep,
  useTriggerModule,
  workflowKeys,
} from "@/hooks/use-workflows";

export function useEligibleStaff(_requiredCertification: string | null) {
  return useQuery({
    queryKey: ["workflow", "eligible-staff", _requiredCertification],
    queryFn: async () => {
      const staff = await getStaffs();
      return staff.map((s): StaffCertification => ({
        id: s.id,
        name: `${s.firstName} ${s.lastName}`,
        role: s.role as StaffCertification["role"],
        active: s.status === "active",
        certifications: [],
      }));
    },
    staleTime: 60_000,
  });
}
