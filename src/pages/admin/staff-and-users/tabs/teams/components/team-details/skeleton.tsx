import { CloseButton, Drawer, Flex, Stack } from "@chakra-ui/react";
import { ThemeSkeleton } from "../../../../components/theme-skeleton";

export function TeamDetailsSkeleton() {
  return (
    <>
      <Drawer.Header
        borderBottom="1px solid"
        borderColor="border"
        pt={6}
        pb={4}
      >
        <Flex justify="space-between" align="start">
          <Stack gap={2} flex={1}>
            <ThemeSkeleton h="24px" w="200px" />
            <ThemeSkeleton h="14px" w="300px" />
          </Stack>
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

      <Flex
        gap={1}
        px={6}
        py={3}
        borderBottom="1px solid"
        borderColor="border"
        align="center"
      >
        <ThemeSkeleton h="12px" w="60px" />
        <ThemeSkeleton h="12px" w="70px" mx={4} />
        <ThemeSkeleton h="12px" w="50px" />
        <ThemeSkeleton h="12px" w="80px" mx={4} />
      </Flex>

      <Flex direction="column" gap={5} px={6} py={6}>
        <Flex gap={4} wrap="wrap">
          <ThemeSkeleton h="88px" flex="1" minW="160px" borderRadius="md" />
          <ThemeSkeleton h="88px" flex="1" minW="160px" borderRadius="md" />
        </Flex>
        <Flex gap={4} wrap="wrap">
          <ThemeSkeleton h="88px" flex="1" minW="160px" borderRadius="md" />
          <ThemeSkeleton h="88px" flex="1" minW="160px" borderRadius="md" />
        </Flex>

        <Stack gap={2} pt={1}>
          <ThemeSkeleton h="11px" w="110px" />
          <ThemeSkeleton h="8px" borderRadius="full" />
        </Stack>

        <ThemeSkeleton h="1px" />

        <Stack gap={2}>
          <ThemeSkeleton h="11px" w="70px" />
          <Flex bg="bg.subtle" p={4} borderRadius="xl" align="center" gap={3}>
            <ThemeSkeleton boxSize="40px" borderRadius="full" flexShrink={0} />
            <Stack gap={1.5} flex={1}>
              <ThemeSkeleton h="14px" w="140px" />
              <ThemeSkeleton h="12px" w="90px" />
            </Stack>
            <ThemeSkeleton h="20px" w="44px" borderRadius="md" flexShrink={0} />
          </Flex>
        </Stack>

        <ThemeSkeleton h="1px" />

        <Stack gap={2}>
          <ThemeSkeleton h="11px" w="100px" />
          <Flex gap={2} wrap="wrap">
            <ThemeSkeleton h="26px" w="80px" borderRadius="sm" />
            <ThemeSkeleton h="26px" w="110px" borderRadius="sm" />
            <ThemeSkeleton h="26px" w="70px" borderRadius="sm" />
            <ThemeSkeleton h="26px" w="95px" borderRadius="sm" />
          </Flex>
        </Stack>

        <ThemeSkeleton h="1px" />

        <Stack gap={3} pt={1}>
          <ThemeSkeleton h="40px" borderRadius="md" />
          <ThemeSkeleton h="40px" borderRadius="md" />
          <ThemeSkeleton h="40px" borderRadius="md" />
        </Stack>
      </Flex>
    </>
  );
}
