import { useFirmProfile, useFirmSnapshot } from "@/hooks/use-firm-settings";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { Box, Flex, Image, Stack, Text } from "@chakra-ui/react";

function initialsFromName(name: string): string {
  const words = name
    .split(/\s+/)
    .map((w) => w.replace(/[^A-Za-z]/g, ""))
    .filter((w) => w.length > 0);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0][0].toUpperCase();
  return `${words[0][0]}&${words[1][0]}`.toUpperCase();
}

export function FirmSnapshotCard() {
  const { data: snapshot, isLoading } = useFirmSnapshot();
  const { data: profile } = useFirmProfile();

  const firmName =
    profile?.firmLegalName ?? profile?.displayName ?? "";
  const initials = initialsFromName(firmName);

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      overflow="hidden"
    >
      <Flex
        align="flex-start"
        justify="space-between"
        gap="4"
        p="20px"
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Box>
          <Text fontSize="16px" fontWeight="600" color="fg">
            Firm snapshot
          </Text>
        </Box>
      </Flex>

      {isLoading ? (
        <Box p="20px">
          <Flex justify="center" mb="4">
            <ThemeSkeleton w="80px" h="80px" borderRadius="16px" />
          </Flex>
          <ThemeSkeleton h="12px" w="140px" mx="auto" mb="6" borderRadius="4px" />
          <Stack gap="3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Flex key={i} justify="space-between" align="center">
                <ThemeSkeleton h="13px" w={`${60 + i * 5}px`} borderRadius="4px" />
                <ThemeSkeleton h="13px" w={`${50 + i * 8}px`} borderRadius="4px" />
              </Flex>
            ))}
          </Stack>
        </Box>
      ) : (
        <Box p="20px">
          <Flex justify="center" mb="4">
            {snapshot?.logoUrl ? (
              <Box
                w="80px"
                h="80px"
                borderRadius="16px"
                overflow="hidden"
                bg="bg.muted"
              >
                <Image
                  src={snapshot.logoUrl}
                  alt={firmName || "Firm logo"}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                />
              </Box>
            ) : (
              <Box
                w="80px"
                h="80px"
                borderRadius="16px"
                bg="brand.solid"
                color="brand.contrast"
                display="flex"
                alignItems="center"
                justifyContent="center"
                fontSize="28px"
                fontWeight="700"
                letterSpacing="-0.02em"
              >
                {initials}
              </Box>
            )}
          </Flex>
          <Text fontSize="12px" color="brand.solid" textAlign="center" mb="6">
            Upload logo in White label tab
          </Text>

          <Box display="flex" flexDirection="column" gap="3">
            <Flex justify="space-between" align="center">
              <Text fontSize="13px" color="fg.muted">
                Plan
              </Text>
              <Text fontSize="13px" color="fg" fontWeight="500">
                {snapshot?.plan ?? "—"}
              </Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontSize="13px" color="fg.muted">
                Add-ons
              </Text>
              <Text fontSize="13px" color="fg" fontWeight="500">
                {snapshot?.activeAddons != null
                  ? `${snapshot.activeAddons} active`
                  : "—"}
              </Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontSize="13px" color="fg.muted">
                Staff
              </Text>
              <Text fontSize="13px" color="fg" fontWeight="500">
                {snapshot?.staffCount != null
                  ? `${snapshot.staffCount} members`
                  : "—"}
              </Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontSize="13px" color="fg.muted">
                Founded
              </Text>
              <Text fontSize="13px" color="fg" fontWeight="500">
                {snapshot?.foundedYear ?? "—"}
              </Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Text fontSize="13px" color="fg.muted">
                Jurisdiction
              </Text>
              <Text fontSize="13px" color="fg" fontWeight="500">
                {snapshot?.jurisdiction ?? "—"}
              </Text>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
}
