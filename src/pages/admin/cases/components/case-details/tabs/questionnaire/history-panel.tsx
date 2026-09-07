import type { AnswerVersion } from "@/api/questionnaires";
import {
  useCaseVersion,
  useCaseVersions,
  useRestoreVersion,
} from "@/hooks/use-case-questionnaire";
import { formatDateTime, fromNow } from "@/utils/date";
import {
  Badge,
  Button,
  Dialog,
  Flex,
  HStack,
  Portal,
  ScrollArea,
  Separator,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { useState } from "react";

import { StoredValueText } from "@/components/questionnaire/stored-value-text";

/**
 * Every save made against this matter's questionnaire.
 *
 * A list of saves rather than a list of changes: a save is the unit a person
 * did, so "M. Chen saved Beneficiary details, 6 answers changed" is what they
 * recognise coming back to it a week later. Expanding one shows the changes
 * inside it, which is the grain to reach for only once you know which save you
 * are asking about.
 */
export function HistoryPanel({
  caseId,
  open,
  onOpenChange,
}: {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: versions, isLoading } = useCaseVersions(caseId, open);
  const restore = useRestoreVersion(caseId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)} size="lg">
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header pb={2}>
              <VStack align="stretch" gap={0.5}>
                <Dialog.Title fontSize="15px" fontWeight="500">
                  Questionnaire history
                </Dialog.Title>
                <Text fontSize="12px" color="fg.muted">
                  Every save, by staff and by the client. Restoring writes a new
                  save rather than erasing the ones after it.
                </Text>
              </VStack>
            </Dialog.Header>

            <Dialog.Body pb={5}>
              {isLoading ? (
                <Flex justify="center" py={8}>
                  <Spinner size="sm" />
                </Flex>
              ) : (versions?.length ?? 0) === 0 ? (
                <Text fontSize="13px" color="fg.muted" py={4}>
                  Nothing has been saved against this questionnaire yet.
                </Text>
              ) : (
                <ScrollArea.Root maxH="480px">
                  <ScrollArea.Viewport>
                    <ScrollArea.Content>
                      <VStack gap={2} align="stretch" pr={2}>
                        {versions?.map((version, index) => (
                          <VersionRow
                            key={version.id}
                            caseId={caseId}
                            version={version}
                            isCurrent={index === 0}
                            isExpanded={expandedId === version.id}
                            onToggle={() =>
                              setExpandedId(
                                expandedId === version.id ? null : version.id,
                              )
                            }
                            isRestoring={restore.isPending}
                            onRestore={() => restore.mutate(version.id)}
                          />
                        ))}
                      </VStack>
                    </ScrollArea.Content>
                  </ScrollArea.Viewport>
                  <ScrollArea.Scrollbar>
                    <ScrollArea.Thumb />
                  </ScrollArea.Scrollbar>
                </ScrollArea.Root>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

function VersionRow({
  caseId,
  version,
  isCurrent,
  isExpanded,
  onToggle,
  isRestoring,
  onRestore,
}: {
  caseId: string;
  version: AnswerVersion;
  /** The newest save is where the questionnaire already stands. */
  isCurrent: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  isRestoring: boolean;
  onRestore: () => void;
}) {
  return (
    <VStack
      align="stretch"
      gap={0}
      bg="bg.panel"
      borderRadius="sm"
      borderLeft="2px solid"
      borderLeftColor={isCurrent ? "green.solid" : "border"}
    >
      <Flex
        justify="space-between"
        align="center"
        gap={2}
        px={3.5}
        py={3}
        flexWrap="wrap"
      >
        <VStack align="stretch" gap={0.5} flex={1} minW={0}>
          <HStack gap={1.5} flexWrap="wrap">
            <Text fontSize="12px" color="fg" fontWeight="500">
              {version.actor === "client"
                ? "The client"
                : (version.savedBy ?? "A colleague")}
            </Text>
            <Text fontSize="12px" color="fg.muted">
              saved {version.sectionTitle ?? "the questionnaire"}
            </Text>
            {isCurrent && (
              <Badge
                size="sm"
                variant="subtle"
                colorPalette="green"
                fontSize="10px"
              >
                current
              </Badge>
            )}
            {version.restoredFromVersionId && (
              <Badge
                size="sm"
                variant="subtle"
                colorPalette="blue"
                fontSize="10px"
              >
                a restore
              </Badge>
            )}
          </HStack>
          <Text
            fontSize="11px"
            color="fg.muted"
            title={formatDateTime(version.createdAt)}
          >
            save {version.versionNumber} · {fromNow(version.createdAt)} ·{" "}
            {version.changedCount} answer
            {version.changedCount === 1 ? "" : "s"} changed
          </Text>
        </VStack>

        <HStack gap={1} flexShrink={0}>
          <Button
            size="xs"
            variant="ghost"
            h="26px"
            px={2}
            fontSize="12px"
            fontWeight="400"
            color="fg.muted"
            _hover={{ color: "fg" }}
            onClick={onToggle}
          >
            {isExpanded ? "Hide changes" : "See changes"}
          </Button>
          {!isCurrent && (
            <Button
              size="xs"
              variant="ghost"
              h="26px"
              px={2}
              fontSize="12px"
              fontWeight="400"
              color="fg.muted"
              _hover={{ color: "fg" }}
              loading={isRestoring}
              onClick={onRestore}
            >
              <RotateCcw size={12} />
              Restore to here
            </Button>
          )}
        </HStack>
      </Flex>

      {isExpanded && (
        <>
          <Separator />
          <VersionChanges caseId={caseId} versionId={version.id} />
        </>
      )}
    </VStack>
  );
}

/**
 * What one save changed, fetched only when someone asks.
 *
 * The list endpoint deliberately omits this — it is a snapshot plus a row per
 * change, and loading it for forty saves to show three would be the wrong trade
 * every time.
 */
function VersionChanges({
  caseId,
  versionId,
}: {
  caseId: string;
  versionId: string;
}) {
  const { data, isLoading } = useCaseVersion(caseId, versionId);

  if (isLoading) {
    return (
      <Flex justify="center" py={4}>
        <Spinner size="xs" />
      </Flex>
    );
  }

  if (!data || data.changes.length === 0) {
    return (
      <Text fontSize="12px" color="fg.muted" px={3.5} py={3}>
        This save recorded the answers as they stood; it changed nothing on its
        own.
      </Text>
    );
  }

  return (
    <VStack align="stretch" gap={2} px={3.5} py={3}>
      {data.changes.map((change) => (
        <VStack key={change.questionId} align="stretch" gap={0.5}>
          <Text fontSize="12px" color="fg.muted">
            {change.label ?? "A question that has since been removed"}
          </Text>
          <HStack gap={2} align="center" flexWrap="wrap">
            <StoredValueText value={change.previousValue} muted strike />
            <ArrowRight size={11} color="currentColor" />
            <StoredValueText value={change.value} />
          </HStack>
        </VStack>
      ))}
    </VStack>
  );
}
