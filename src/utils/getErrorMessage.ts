import type { APIError } from "@/hooks/types";

export const getErrorMessage = (
  error: unknown,
  fallback = "Something went wrong.",
) => {
  // 1. Guard clause for null/undefined
  if (!error) return fallback;

  // 2. Prioritize APIError check if it's an object
  if (typeof error === "object") {
    // Safely attempt to extract the nested API message first
    const apiMessage = (error as APIError).response?.data?.message;
    if (apiMessage) return apiMessage;

    // Fallback to a flat message property on the object if present
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }

  // 3. Fallback to standard Error instance check
  if (error instanceof Error && error.message) return error.message;

  // 4. Fallback to string primitive check
  if (typeof error === "string") return error;

  return fallback;
};
