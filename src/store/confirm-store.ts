import { create } from "zustand";

type ConfirmState = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  loading: boolean;
  _onConfirm: (() => void) | null;
};

type ConfirmActions = {
  showConfirm: (
    options: ConfirmDialogOptions & { onConfirm: () => void },
  ) => void;
  close: () => void;
  setLoading: (loading: boolean) => void;
};

const DEFAULTS = {
  title: "Confirm",
  description: "Are you sure?",
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
};

export const useConfirmStore = create<ConfirmState & ConfirmActions>()(
  (set) => ({
    isOpen: false,
    title: DEFAULTS.title,
    description: DEFAULTS.description,
    confirmLabel: DEFAULTS.confirmLabel,
    cancelLabel: DEFAULTS.cancelLabel,
    loading: false,
    _onConfirm: null,
    showConfirm: (options) =>
      set({
        isOpen: true,
        title: options.title || DEFAULTS.title,
        description: options.description || DEFAULTS.description,
        confirmLabel: options.confirmLabel || DEFAULTS.confirmLabel,
        cancelLabel: options.cancelLabel || DEFAULTS.cancelLabel,
        loading: false,
        _onConfirm: options.onConfirm,
      }),
    close: () => set({ isOpen: false, loading: false, _onConfirm: null }),
    setLoading: (loading) => set({ loading }),
  }),
);
