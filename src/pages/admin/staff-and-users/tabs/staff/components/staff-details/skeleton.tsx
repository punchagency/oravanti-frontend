import {
  Box,
  CloseButton,
  Drawer,
  Flex,
  Separator,
  VStack,
} from "@chakra-ui/react";
import { ThemeSkeleton } from "../../../../../../../components/ui/theme-skeleton";

function FieldRowSkeleton() {
  return (
    <Box borderBottom="1px solid" borderColor="border.muted" py={2}>
      <ThemeSkeleton h="9px" w="80px" mb={1.5} />
      <ThemeSkeleton h="12px" w="140px" />
    </Box>
  );
}

export function StaffDetailsSkeleton() {
  return (
    <>
      <Drawer.Header
        borderBottom="1px solid"
        borderColor="border"
        px={5}
        py={5}
      >
        <Flex align="flex-start" justify="space-between">
          <Flex align="center" gap={2.5}>
            <ThemeSkeleton boxSize="40px" borderRadius="full" flexShrink={0} />
            <Box>
              <ThemeSkeleton h="18px" w="140px" mb={1.5} />
              <ThemeSkeleton h="12px" w="60px" />
            </Box>
          </Flex>
          <CloseButton
            size="sm"
            border="1px solid"
            borderColor="border.emphasized"
            borderRadius="50%"
            w="32px"
            h="32px"
            color="fg.muted"
          />
        </Flex>
      </Drawer.Header>

      <Box px={5} pb={5}>
        <Flex gap={0} wrap="wrap">
          <Box
            flex="1 1 50%"
            minW="140px"
            borderBottom="1px solid"
            borderColor="border.muted"
            py={2}
          >
            <ThemeSkeleton h="9px" w="60px" mb={1.5} />
            <ThemeSkeleton h="12px" w="100px" />
          </Box>
          <Box
            flex="1 1 50%"
            minW="140px"
            borderBottom="1px solid"
            borderColor="border.muted"
            py={2}
          >
            <ThemeSkeleton h="9px" w="60px" mb={1.5} />
            <ThemeSkeleton h="12px" w="110px" />
          </Box>
        </Flex>
        <FieldRowSkeleton />
        <FieldRowSkeleton />
        <FieldRowSkeleton />
        <FieldRowSkeleton />
        <FieldRowSkeleton />
        <FieldRowSkeleton />
        <FieldRowSkeleton />

        <Box pt={2} pb={2}>
          <ThemeSkeleton h="9px" w="90px" mb={1.5} />
          <Flex gap={1.5} mt={1}>
            <ThemeSkeleton h="20px" w="80px" borderRadius="10px" />
            <ThemeSkeleton h="20px" w="70px" borderRadius="10px" />
          </Flex>
        </Box>

        <Separator borderColor="border" my={3} />

        <ThemeSkeleton h="10px" w="60px" mb={2} />
        <ThemeSkeleton h="24px" w="120px" mb={1.5} />
        <ThemeSkeleton h="6px" borderRadius="3px" w="full" mb={1.5} />
        <ThemeSkeleton h="10px" w="100px" />

        <Separator borderColor="border" my={3} />

        <ThemeSkeleton h="10px" w="40px" mb={1.5} />
        <ThemeSkeleton h="22px" w="90px" borderRadius="12px" />

        <Separator borderColor="border" my={3} />

        <ThemeSkeleton h="10px" w="40px" mb={1.5} />
        <Box bg="bg.subtle" borderRadius="8px" px={3} py={2.5}>
          <ThemeSkeleton h="12px" w="200px" />
        </Box>

        <Separator borderColor="border" my={3} />

        <ThemeSkeleton h="10px" w="70px" mb={2} />
        <VStack gap={1.5} w="full">
          <ThemeSkeleton h="32px" w="full" borderRadius="md" />
          <ThemeSkeleton h="32px" w="full" borderRadius="md" />
          <ThemeSkeleton h="32px" w="full" borderRadius="md" />
        </VStack>
      </Box>
    </>
  );
}
