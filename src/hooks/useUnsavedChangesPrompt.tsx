import { useUnsavedChangesContext } from "@/contexts/unsaved-changes-context";
import { useEffect } from "react";

type UseUnsavedChangesPromptOptions = {
  when: boolean;
  title?: string;
  description?: string;
};

const useUnsavedChangesPrompt = (
  options: UseUnsavedChangesPromptOptions,
): void => {
  const { setUnsavedChanges, clearUnsavedChanges } = useUnsavedChangesContext();
  const { when, title, description } = options;

  useEffect(() => {
    setUnsavedChanges({ when, title, description });
    return () => clearUnsavedChanges();
  }, [when, title, description, setUnsavedChanges, clearUnsavedChanges]);
};

export default useUnsavedChangesPrompt;
