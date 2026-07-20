import { Box, Flex, HStack, Stack } from "@chakra-ui/react";
import { ThemeSkeleton } from "../../../../../../components/ui/theme-skeleton";

const ROWS = 3;

export function TeamsDesktopSkeleton() {
  return (
    <Stack gap={4} display={{ base: "none", lg: "flex" }}>
      {Array.from({ length: ROWS }).map((_, i) => (
        <Box
          key={i}
          p={6}
          border="1px solid"
          borderColor="border"
          borderRadius="lg"
          bg="bg"
        >
          <Flex justify="space-between" align="flex-start" mb={3}>
            <Box>
              <ThemeSkeleton height="20px" width="200px" mb={1} />
              <ThemeSkeleton height="12px" width="100px" borderRadius="full" />
            </Box>
            <HStack gap={2}>
              <ThemeSkeleton height="32px" width="100px" borderRadius="md" />
              <ThemeSkeleton height="32px" width="110px" borderRadius="md" />
            </HStack>
          </Flex>

          <Flex align="center" gap={4} mt={4} mb={3.5}>
            <ThemeSkeleton height="30px" width="40px" />
            <ThemeSkeleton height="14px" width="80px" />
            <Box flex={1} maxW="200px">
              <ThemeSkeleton height="8px" width="100%" borderRadius="full" />
            </Box>
            <ThemeSkeleton height="14px" width="30px" />
          </Flex>

          <Box h="0.5px" bg="border.muted" my={3.5} />

          <Flex align="center" gap={3}>
            <ThemeSkeleton height="14px" width="70px" />
            <ThemeSkeleton boxSize="28px" borderRadius="full" />
            <ThemeSkeleton height="16px" width="120px" />
            <ThemeSkeleton height="20px" width="60px" borderRadius="full" />
            <ThemeSkeleton height="20px" width="40px" borderRadius="full" />
          </Flex>

          <Box h="0.5px" bg="border.muted" my={3.5} />

          <Flex justify="space-between" align="center" mb={3}>
            <ThemeSkeleton height="14px" width="60px" />
            <ThemeSkeleton height="14px" width="40px" />
          </Flex>

          <Flex wrap="wrap" gap={3}>
            {Array.from({ length: 3 }).map((_, j) => (
              <HStack key={j} gap={1.5}>
                <ThemeSkeleton boxSize="20px" borderRadius="full" />
                <ThemeSkeleton height="14px" width="80px" />
              </HStack>
            ))}
          </Flex>
        </Box>
      ))}
    </Stack>
  );
}
