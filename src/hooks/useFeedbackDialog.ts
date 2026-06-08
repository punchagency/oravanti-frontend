import { useFeedbackStore } from "@/store/feedback-store";

export const useFeedbackDialog = () => {
  const showSuccess = useFeedbackStore((s) => s.showSuccess);
  const showError = useFeedbackStore((s) => s.showError);
  return { showSuccess, showError };
};
