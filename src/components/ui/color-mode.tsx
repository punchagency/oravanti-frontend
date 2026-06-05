import { ClientOnly, IconButton, Skeleton } from "@chakra-ui/react";
import type { IconButtonProps } from "@chakra-ui/react";
import { Laptop, Moon, Sun } from "lucide-react";
import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider, useTheme } from "next-themes";
import { useColorMode } from "@/hooks/use-color-mode";

export type ColorModeProviderProps = ThemeProviderProps;

export function ColorModeProvider(props: ColorModeProviderProps) {
  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    />
  );
}

function ColorModeIcon() {
  const { theme, resolvedTheme } = useTheme();

  if (theme === "system") {
    return <Laptop size={18} />;
  }

  return resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />;
}

type ColorModeButtonProps = Omit<IconButtonProps, "aria-label">;

export function ColorModeButton(props: ColorModeButtonProps) {
  const { toggleColorMode } = useColorMode();

  return (
    <ClientOnly fallback={<Skeleton boxSize="9" borderRadius="8px" />}>
      <IconButton
        aria-label="Toggle color mode"
        data-theme-toggle
        size="sm"
        variant="outline"
        onClick={toggleColorMode}
        {...props}
      >
        <ColorModeIcon />
      </IconButton>
    </ClientOnly>
  );
}
