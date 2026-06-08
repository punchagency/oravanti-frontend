type FeedbackDialogOptions = {
  title?: string;
  description?: string;
};

type FeedbackDialogContextValue = {
  showSuccess: (options?: FeedbackDialogOptions) => void;
  showError: (options?: FeedbackDialogOptions) => void;
};
