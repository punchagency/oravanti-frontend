import { useTheme } from "next-themes";

export type ColorMode = "light" | "dark";

export function useColorMode() {
  const { resolvedTheme, setTheme } = useTheme();
  const colorMode = resolvedTheme === "dark" ? "dark" : "light";

  return {
    colorMode,
    setColorMode: setTheme,
    toggleColorMode: () => setTheme(colorMode === "dark" ? "light" : "dark"),
  };
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode();
  return colorMode === "dark" ? dark : light;
}
