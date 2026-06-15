import { useConfirmStore } from "@/store/confirm-store";

export const useConfirmDialog = () => {
  const showConfirm = useConfirmStore((s) => s.showConfirm);
  return { showConfirm };
};
