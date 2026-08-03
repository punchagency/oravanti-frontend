import { useColorMode } from "@/hooks/use-color-mode";
import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import { colorModes } from "./constants";

export default function AppearanceTab() {
  const { colorMode, setColorMode } = useColorMode();

  return (
    <Box>
      <VStack align="start" gap="1" mb="8">
        <Heading size="lg" fontWeight="semibold">
          Appearance Settings
        </Heading>
        <Text color="fg.muted" fontSize="sm">
          Customize the look and feel of your platform
        </Text>
      </VStack>

      <Box>
        <Text fontSize="13px" fontWeight="600" color="fg" mb="3">
          Theme
        </Text>
        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", sm: "repeat(3, 1fr)" }}
          gap={{ base: "3", md: "4" }}
          maxW={"xl"}
        >
          {colorModes.map((mode) => {
            const isSelected = colorMode === mode.value;
            const Icon = mode.icon;
            return (
              <Box
                key={mode.value}
                border="2px solid"
                borderColor={isSelected ? "brand.solid" : "border"}
                rounded={"md"}
                cursor="pointer"
                onClick={() => setColorMode(mode.value)}
                overflow="hidden"
                transition="border-color 0.15s"
                _hover={{
                  borderColor: isSelected ? "brand.solid" : "border.emphasized",
                }}
              >
                <Box p="2">
                  <Icon />
                </Box>
                <Text
                  fontSize="13px"
                  fontWeight={isSelected ? "600" : "400"}
                  color="fg"
                  textAlign="center"
                  pb="2"
                >
                  {mode.title}
                </Text>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
