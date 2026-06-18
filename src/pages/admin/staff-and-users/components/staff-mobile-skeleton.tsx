import {
  Box,
  Flex,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ThemeSkeleton } from "./theme-skeleton";

const ROWS = 5;

export function StaffMobileSkeleton() {
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
            <HStack gap={3} minW={0}>
              <ThemeSkeleton boxSize="32px" borderRadius="full" flexShrink={0} />
              <Box minW={0}>
                <ThemeSkeleton height="14px" width="140px" mb={1.5} />
                <ThemeSkeleton height="11px" width="100px" />
              </Box>
            </HStack>
            <ThemeSkeleton height="20px" width="80px" borderRadius="full" flexShrink={0} />
          </Flex>

          <Stack gap={3} pt={2} borderTop="1px solid" borderColor="border.muted">
            <Flex justify="space-between" align="center">
              <Text color="fg.subtle" textStyle="body-sm">Role:</Text>
              <ThemeSkeleton height="14px" width="70px" />
            </Flex>
            <Flex justify="space-between" align="center">
              <Text color="fg.subtle" textStyle="body-sm">Team:</Text>
              <ThemeSkeleton height="14px" width="90px" />
            </Flex>
            <Flex justify="space-between" align="center">
              <Text color="fg.subtle" textStyle="body-sm" flexShrink={0}>Practice Areas:</Text>
              <HStack gap={1} justify="flex-end">
                <ThemeSkeleton height="18px" width="80px" borderRadius="full" />
                <ThemeSkeleton height="18px" width="60px" borderRadius="full" />
              </HStack>
            </Flex>
            <Box pt={1}>
              <Flex justify="space-between" mb={1}>
                <Text color="fg.subtle" textStyle="body-sm">Caseload Capacity:</Text>
                <ThemeSkeleton height="14px" width="60px" />
              </Flex>
              <ThemeSkeleton height="4px" width="100%" borderRadius="full" />
            </Box>
          </Stack>

          <ThemeSkeleton height="36px" width="100%" borderRadius="md" mt={4} />
        </Box>
      ))}
    </Stack>
  );
}
