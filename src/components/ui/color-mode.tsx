import { ClientOnly, IconButton, Skeleton } from "@chakra-ui/react";
import type { IconButtonProps } from "@chakra-ui/react";
import { Box, HStack, Text, VStack } from "@chakra-ui/react";
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

const THEME_OPTIONS = [
  { value: "light" as const, label: "Light", icon: Sun },
  { value: "dark" as const, label: "Dark", icon: Moon },
  { value: "system" as const, label: "System", icon: Laptop },
];

export function ColorModeSwitcher() {
  const { colorMode, setColorMode } = useColorMode();

  return (
    <Box>
      <Text fontSize="13px" fontWeight="600" color="fg" mb="3">
        Theme
      </Text>
      <HStack
        gap={{ base: "3", md: "4" }}
        flexWrap={{ base: "wrap", md: "nowrap" }}
      >
        {THEME_OPTIONS.map((option) => {
          const isSelected = colorMode === option.value;
          const Icon = option.icon;
          return (
            <Box
              key={option.value}
              border="2px solid"
              borderColor={isSelected ? "brand.solid" : "border"}
              borderRadius="10px"
              cursor="pointer"
              onClick={() => setColorMode(option.value)}
              px="6"
              py="4"
              flex="1"
              minW={{ base: "100px", md: "140px" }}
              transition="border-color 0.15s"
              _hover={{ borderColor: isSelected ? "brand.solid" : "border.emphasized" }}
            >
              <VStack gap="2">
                <Box color={isSelected ? "brand.solid" : "fg.muted"}>
                  <Icon size={24} />
                </Box>
                <Text
                  fontSize="13px"
                  fontWeight={isSelected ? "600" : "400"}
                  color="fg"
                >
                  {option.label}
                </Text>
              </VStack>
            </Box>
          );
        })}
      </HStack>
    </Box>
  );
}
