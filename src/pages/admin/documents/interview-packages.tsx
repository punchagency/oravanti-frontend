import {
  BrandButton,
  OutlineButton,
  StatusPill,
  SurfaceCard,
} from "@/components/ui/intake-ui";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Box, Flex, HStack, Progress, Stack, Text } from "@chakra-ui/react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Plus,
  Send,
} from "lucide-react";
import { interviewPackages, type InterviewPackage } from "./data";

function PackageCard({ pkg }: { pkg: InterviewPackage }) {
  const complete = pkg.items.filter((item) => item.present).length;
  const total = pkg.items.length;
  const percent = Math.round((complete / total) * 100);
  const ready = complete === total;

  return (
    <SurfaceCard>
      <Flex justifyContent="space-between" alignItems="flex-start" gap="16px">
        <Box>
          <Text fontSize="16px" fontWeight="600" color="fg">
            {pkg.client}
          </Text>
          <Text fontSize="12px" color="fg.muted" fontFamily="mono" mt="2px">
            {pkg.reference} · {pkg.caseType}
          </Text>
        </Box>
        <StatusPill tone={ready ? "success" : "gold"}>{pkg.badge}</StatusPill>
      </Flex>

      <Text
        mt="14px"
        fontSize="10px"
        fontWeight="600"
        letterSpacing="0.06em"
        color="fg.muted"
      >
        PACKAGE CHECKLIST
      </Text>

      <Stack gap="0" mt="4px">
        {pkg.items.map((item) => (
          <HStack
            key={item.label}
            gap="8px"
            py="9px"
            borderBottom="1px solid"
            borderColor="border.muted"
            color={item.present ? "fg" : "#b5851f"}
          >
            <Box flexShrink={0}>
              {item.present ? (
                <CheckCircle2 size={15} />
              ) : (
                <AlertTriangle size={15} />
              )}
            </Box>
            <Text fontSize="13px">
              {item.label}
              {!item.present && " — MISSING"}
            </Text>
          </HStack>
        ))}
      </Stack>

      <Box mt="16px">
        <Flex justifyContent="space-between" alignItems="center" mb="6px">
          <Text fontSize="12px" color="fg.muted">
            {complete} of {total} items complete
          </Text>
          <Text fontSize="12px" color="fg.muted">
            {percent}%
          </Text>
        </Flex>
        <Progress.Root value={percent} size="sm" borderRadius="full">
          <Progress.Track borderRadius="full" bg="border.muted">
            <Progress.Range borderRadius="full" bg="#2e9e6b" />
          </Progress.Track>
        </Progress.Root>
      </Box>

      <Flex mt="18px" justifyContent="flex-end" gap="8px" flexWrap="wrap">
        <OutlineButton>
          <HStack gap="6px">
            <Plus size={14} />
            <Text>Add document</Text>
          </HStack>
        </OutlineButton>
        <OutlineButton>
          <HStack gap="6px">
            <Download size={14} />
            <Text>Export PDF</Text>
          </HStack>
        </OutlineButton>
        <BrandButton>
          <HStack gap="6px">
            <Send size={14} />
            <Text>Transmit package</Text>
          </HStack>
        </BrandButton>
      </Flex>
    </SurfaceCard>
  );
}

export function InterviewPackagesPage() {
  useDocumentTitle("Interview packages");

  return (
    <Box pt="24px" pb="56px">
      <Flex
        justifyContent="space-between"
        alignItems="flex-start"
        gap="16px"
        flexWrap="wrap"
      >
        <Box>
          <Text textStyle="heading">Interview packages</Text>
          <Text color="fg.muted" mt="2px" fontSize="14px">
            USCIS interview document bundles ready for transmission
          </Text>
        </Box>
        <OutlineButton>
          <HStack gap="6px">
            <Plus size={14} />
            <Text>New package</Text>
          </HStack>
        </OutlineButton>
      </Flex>

      <Stack mt="20px" gap="16px">
        {interviewPackages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
      </Stack>
    </Box>
  );
}
