import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "@/components/ui/color-mode";
import { systemThemeConfig } from "@/utils/theme";
import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NuqsAdapter } from "nuqs/adapters/react-router/v7";
import type { PropsWithChildren } from "react";
import { Toaster } from "sonner";
import { ConfirmDialogProvider } from "./confirmDialogProvider";
import { FeedbackDialogProvider } from "./feedbackDialogProvider";

/**
 * App-wide query policy: session-scoped reference data never goes stale on
 * its own (lists refresh via invalidation after mutations), and failed
 * requests surface immediately instead of being retried behind a spinner.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      retry: false,
    },
  },
});

export function Provider({
  children,
  ...colorModeProps
}: PropsWithChildren<ColorModeProviderProps>) {
  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider value={systemThemeConfig}>
          <ColorModeProvider {...colorModeProps}>
            <ConfirmDialogProvider>
              <FeedbackDialogProvider>{children}</FeedbackDialogProvider>
            </ConfirmDialogProvider>
          </ColorModeProvider>
        </ChakraProvider>
        <Toaster richColors position="top-right" closeButton />
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
