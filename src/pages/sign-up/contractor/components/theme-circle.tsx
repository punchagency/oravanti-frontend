import { useColorMode } from "@/hooks/use-color-mode";
import { Moon, Sun } from "lucide-react";

export function ThemeCircle() {
  const { colorMode, toggleColorMode } = useColorMode();
  const Icon = colorMode === "dark" ? Sun : Moon;

  return (
    <button
      className="signup-theme-button"
      type="button"
      aria-label="Toggle theme"
      onClick={toggleColorMode}
    >
      <Icon size={16} />
    </button>
  );
}
