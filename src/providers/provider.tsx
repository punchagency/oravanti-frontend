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

const queryClient = new QueryClient();

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
