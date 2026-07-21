import { Box, Flex, HStack, Stack, Text } from "@chakra-ui/react";
import { ThemeSkeleton } from "../../../../../../components/ui/theme-skeleton";

const ROWS = 3;

export function TeamsMobileSkeleton() {
  return (
    <Stack gap={4} display={{ base: "flex", lg: "none" }}>
      {Array.from({ length: ROWS }).map((_, i) => (
        <Box
          key={i}
          p={4}
          border="1px solid"
          borderColor="border"
          borderRadius="lg"
          bg="bg"
        >
          <Flex justify="space-between" align="flex-start" mb={3}>
            <Box minW={0} flex={1}>
              <ThemeSkeleton height="16px" width="160px" mb={1} />
              <ThemeSkeleton height="12px" width="80px" borderRadius="full" />
            </Box>
          </Flex>

          <Flex align="center" gap={3} mb={2}>
            <ThemeSkeleton height="24px" width="30px" />
            <ThemeSkeleton height="14px" width="80px" />
            <ThemeSkeleton height="14px" width="30px" />
          </Flex>

          <ThemeSkeleton height="4px" width="100%" borderRadius="full" mb={3} />

          <Stack
            gap={2}
            pt={2}
            borderTop="1px solid"
            borderColor="border.muted"
          >
            <Flex justify="space-between" align="center">
              <Text color="fg.subtle" textStyle="body-sm">
                Team lead:
              </Text>
              <HStack gap={1.5}>
                <ThemeSkeleton boxSize="20px" borderRadius="full" />
                <ThemeSkeleton height="14px" width="100px" />
              </HStack>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text color="fg.subtle" textStyle="body-sm">
                Members:
              </Text>
              <ThemeSkeleton height="14px" width="50px" />
            </Flex>
            <Flex wrap="wrap" gap={2}>
              {Array.from({ length: 2 }).map((_, j) => (
                <HStack key={j} gap={1}>
                  <ThemeSkeleton boxSize="18px" borderRadius="full" />
                  <ThemeSkeleton height="12px" width="60px" />
                </HStack>
              ))}
            </Flex>
          </Stack>

          <ThemeSkeleton height="36px" width="100%" borderRadius="md" mt={4} />
        </Box>
      ))}
    </Stack>
  );
}
