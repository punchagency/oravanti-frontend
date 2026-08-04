import { Button, Dialog, Stack, Text } from "@chakra-ui/react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useBlocker } from "react-router";

type UnsavedChangesOptions = {
  when: boolean;
  title?: string;
  description?: string;
};

type UnsavedChangesContextValue = {
  setUnsavedChanges: (options: UnsavedChangesOptions) => void;
  clearUnsavedChanges: () => void;
};

type UnsavedChangesState = {
  when: boolean;
  title: string;
  description: string;
};

const DEFAULT_TITLE = "Unsaved changes";
const DEFAULT_DESCRIPTION =
  "You have unsaved changes. Are you sure you want to leave this page?";

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(
  null,
);

export const UnsavedChangesProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [state, setState] = useState<UnsavedChangesState>({
    when: false,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  });

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      state.when && currentLocation.pathname !== nextLocation.pathname,
  );

  const isBlocked = blocker.state === "blocked";

  const handleStay = () => {
    if (blocker.state === "blocked") blocker.reset();
  };

  const handleLeave = () => {
    if (blocker.state === "blocked") blocker.proceed();
  };

  const setUnsavedChanges = useCallback((options: UnsavedChangesOptions) => {
    setState({
      when: options.when,
      title: options.title || DEFAULT_TITLE,
      description: options.description || DEFAULT_DESCRIPTION,
    });
  }, []);

  const clearUnsavedChanges = useCallback(() => {
    setState({
      when: false,
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
    });
  }, []);

  const value = useMemo(
    () => ({ setUnsavedChanges, clearUnsavedChanges }),
    [setUnsavedChanges, clearUnsavedChanges],
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      <Dialog.Root open={isBlocked} onOpenChange={handleStay}>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner>
          <Dialog.Content
            layerStyle="surface-card"
            p="0"
            mx={{ base: 3, lg: 0 }}
          >
            <Dialog.Body p="6">
              <Stack gap="3">
                <Dialog.Title textStyle="heading" color="fg">
                  {state.title}
                </Dialog.Title>
                <Text textStyle="subheadline" color="fg.muted">
                  {state.description}
                </Text>
              </Stack>
            </Dialog.Body>
            <Dialog.Footer gap="3" p="6" pt="0">
              <Button variant="outline" onClick={handleStay}>
                Stay
              </Button>
              <Button layerStyle="brand-button" onClick={handleLeave}>
                Leave page
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </UnsavedChangesContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUnsavedChangesContext = () => {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error(
      "useUnsavedChangesContext must be used within UnsavedChangesProvider",
    );
  }
  return context;
};
