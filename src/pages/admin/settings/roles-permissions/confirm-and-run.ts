import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useConfirmStore } from "@/store/confirm-store";

/** Runs `showConfirm`, wiring the confirm dialog's loading state to `mutateAsync`. */
export function confirmAndRun<T>(
  showConfirm: ReturnType<typeof useConfirmDialog>["showConfirm"],
  mutateAsync: (arg: T) => Promise<unknown>,
  arg: T,
  options: { title: string; description: string; confirmLabel: string },
) {
  showConfirm({
    ...options,
    cancelLabel: "Cancel",
    onConfirm: async () => {
      useConfirmStore.getState().setLoading(true);
      try {
        await mutateAsync(arg);
        useConfirmStore.getState().close();
      } catch {
        useConfirmStore.getState().setLoading(false);
        useConfirmStore.getState().close();
      }
    },
  });
}
