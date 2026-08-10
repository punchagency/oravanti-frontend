import {
  updateOrganization,
  type FirmInformationUpdate,
} from "@/api/auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { APIError } from "./types";

function createOrganizationSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function useUpdateFirmInformation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: FirmInformationUpdate) =>
      updateOrganization({
        ...input,
        slug: createOrganizationSlug(input.name),
      }),
    onSuccess: () => {
      toast.success("Firm information updated");
      qc.invalidateQueries({ queryKey: ["firmProfile"] });
      qc.invalidateQueries({ queryKey: ["firmSnapshot"] });
    },
    onError: (err: APIError) => {
      toast.error(
        err.response?.data?.message ?? "Failed to update firm information",
      );
    },
  });
}
