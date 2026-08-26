import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getIntakePipelineTemplate,
  saveIntakePipelineSteps,
} from "@/api/intake-pipeline-template";
import type { IntakePipelineStepInput } from "@/api/intake-pipeline-template";
import type { APIError } from "./types";

export const intakeTemplateKeys = {
  all: ["intakePipelineTemplate"] as const,
};

export function useIntakePipelineTemplate(enabled = true) {
  return useQuery({
    queryKey: intakeTemplateKeys.all,
    queryFn: getIntakePipelineTemplate,
    enabled,
  });
}

export function useSaveIntakePipelineSteps() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (steps: IntakePipelineStepInput[]) => saveIntakePipelineSteps(steps),
    onSuccess: () => {
      toast.success("Intake checklist saved");
      queryClient.invalidateQueries({ queryKey: intakeTemplateKeys.all });
      // Leads already in the pipeline keep the tasks they were stamped with —
      // the change reaches new leads only. Nothing else to invalidate.
    },
    onError: (err: APIError) => {
      toast.error(err.response?.data?.message ?? "Failed to save the intake checklist");
    },
  });
}
