import type { CaseReviewConfig } from "@/api/case-review";
import { SurfaceCard } from "@/components/ui/intake-ui";
import {
  useCaseReviewConfig,
  useUpdateCaseReviewConfig,
} from "@/hooks/use-case-review";
import { useCanConfigureCaseReview } from "@/hooks/use-can-configure-case-review";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Box, Flex, Skeleton, Stack, Switch, Text } from "@chakra-ui/react";
import { ShieldAlert } from "lucide-react";

type ToggleKey = keyof CaseReviewConfig;

const TOGGLES: { key: ToggleKey; label: string; help: string }[] = [
  {
    key: "isActive",
    label: "AI case review active",
    help: "Turn automated document review on or off for the whole firm.",
  },
  {
    key: "crossCheckingEnabled",
    label: "Cross-document checking",
    help: "Compare fields across a matter's documents and flag conflicts.",
  },
  {
    key: "photoComparisonEnabled",
    label: "Photo comparison",
    help: "Compare faces across identity documents that carry a photo.",
  },
  {
    key: "realtimeAnalysis",
    label: "Real-time analysis",
    help: "Scan documents as they are uploaded, not only on a full scan.",
  },
];

export function AiReviewSettingsPage() {
  useDocumentTitle("AI review settings");
  const canConfigure = useCanConfigureCaseReview();
  const config = useCaseReviewConfig(canConfigure);
  const update = useUpdateCaseReviewConfig();

  if (!canConfigure) {
    return (
      <Box pt="24px" maxW="640px">
        <SurfaceCard>
          <Flex direction="column" align="center" gap="8px" py="24px" textAlign="center">
            <Box color="fg.muted">
              <ShieldAlert size={28} />
            </Box>
            <Text fontWeight="600" color="fg">
              Settings are restricted
            </Text>
            <Text fontSize="13px" color="fg.muted">
              Only firm owners and admins can change AI review settings.
            </Text>
          </Flex>
        </SurfaceCard>
      </Box>
    );
  }

  return (
    <Box pt="24px" maxW="640px">
      <Text textStyle="heading">AI review settings</Text>
      <Text color="fg.muted" mt="2px" fontSize="14px">
        Control what the automated review checks and when it runs.
      </Text>

      <Box mt="20px">
        <SurfaceCard>
          <Stack gap="4px">
            {config.isLoading ? (
              <Skeleton h="140px" />
            ) : (
              TOGGLES.map((toggle, i) => {
                const value = config.data?.[toggle.key] ?? false;
                return (
                  <Flex
                    key={toggle.key}
                    justifyContent="space-between"
                    alignItems="center"
                    gap="16px"
                    py="14px"
                    borderTop={i === 0 ? undefined : "1px solid"}
                    borderColor="border.muted"
                  >
                    <Box>
                      <Text fontWeight="500" color="fg" fontSize="14px">
                        {toggle.label}
                      </Text>
                      <Text fontSize="12px" color="fg.muted" mt="2px">
                        {toggle.help}
                      </Text>
                    </Box>
                    <Switch.Root
                      checked={value}
                      disabled={update.isPending}
                      onCheckedChange={(e) =>
                        update.mutate({ [toggle.key]: e.checked })
                      }
                    >
                      <Switch.HiddenInput />
                      <Switch.Control bg={value ? "brand.solid" : undefined}>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </Flex>
                );
              })
            )}
          </Stack>
        </SurfaceCard>
      </Box>
    </Box>
  );
}
