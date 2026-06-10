import { contractorSignUpWithEmail } from "@/api/auth";
import type { APIError } from "@/hooks/types";
import type { ContractorSignupPayload } from "../pages/contractor-sign-up/schema";
import { useMutation } from "@tanstack/react-query";

export function useContractorSignup() {
  return useMutation<unknown, APIError, ContractorSignupPayload>({
    mutationFn: contractorSignUpWithEmail,
  });
}
