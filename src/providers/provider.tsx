import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "@/components/ui/color-mode";
import { systemThemeConfig } from "@/utils/theme";
import { ChakraProvider } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { Toaster } from "sonner";
import { FeedbackDialogProvider } from "./feedbackDialogProvider";

const queryClient = new QueryClient();

export function Provider({
  children,
  ...colorModeProps
}: PropsWithChildren<ColorModeProviderProps>) {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={systemThemeConfig}>
        <ColorModeProvider {...colorModeProps}>
          <FeedbackDialogProvider>{children}</FeedbackDialogProvider>
        </ColorModeProvider>
      </ChakraProvider>
      <Toaster richColors />
    </QueryClientProvider>
  );
}
