type ConfirmDialogOptions = {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ConfirmDialogContextValue = {
  showConfirm: (
    options: ConfirmDialogOptions & {
      onConfirm: () => void;
    },
  ) => void;
};
