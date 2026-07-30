import { useTheme } from "next-themes";

export type ColorMode = "light" | "dark" | "system";

export function useColorMode() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const colorMode = (theme as ColorMode) ?? "system";

  return {
    colorMode,
    resolvedColorMode: resolvedTheme === "dark" ? "dark" : "light",
    setColorMode: setTheme,
    toggleColorMode: () => setTheme(resolvedTheme === "dark" ? "light" : "dark"),
  };
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { resolvedColorMode } = useColorMode();
  return resolvedColorMode === "dark" ? dark : light;
}
