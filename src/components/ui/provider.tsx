import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PropsWithChildren } from "react";
import { Toaster } from "sonner";
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "@/components/ui/color-mode";

const queryClient = new QueryClient();

export function Provider({
  children,
  ...colorModeProps
}: PropsWithChildren<ColorModeProviderProps>) {
  return (
    <QueryClientProvider client={queryClient}>
      <ChakraProvider value={defaultSystem}>
        <ColorModeProvider {...colorModeProps}>{children}</ColorModeProvider>
      </ChakraProvider>
      <Toaster richColors />
    </QueryClientProvider>
  );
}
