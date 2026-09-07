import type { AnswerRevision } from "@/api/questionnaires";
import {
  useAnswerHistory,
  useRestoreAnswer,
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
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ArrowRight, RotateCcw } from "lucide-react";

import { StoredValueText } from "@/components/questionnaire/stored-value-text";

/**
 * One answer's whole life, and a way back to any point in it.
 *
 * Reached from the row itself rather than from the version list, because the
 * question a person has here is about one answer — "who changed this, and what
 * did it say before?" — and finding that in a list of whole-questionnaire saves
 * would mean opening each one to look.
 */
export function AnswerHistoryDialog({
  caseId,
  questionId,
  questionLabel,
  open,
  onOpenChange,
}: {
  caseId: string;
  questionId: string | null;
  questionLabel: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: revisions, isLoading } = useAnswerHistory(
    caseId,
    open ? questionId : null,
  );
  const restore = useRestoreAnswer(caseId);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => onOpenChange(e.open)}
      size="md"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header pb={2}>
              <VStack align="stretch" gap={0.5}>
                <Dialog.Title fontSize="15px" fontWeight="500">
                  Answer history
                </Dialog.Title>
                <Text fontSize="12px" color="fg.muted">
                  {questionLabel}
                </Text>
              </VStack>
            </Dialog.Header>

            <Dialog.Body pb={5}>
              {isLoading ? (
                <Flex justify="center" py={8}>
                  <Spinner size="sm" />
                </Flex>
              ) : (revisions?.length ?? 0) === 0 ? (
                <Text fontSize="13px" color="fg.muted" py={4}>
                  This answer has not been changed since the matter's history
                  began.
                </Text>
              ) : (
                <ScrollArea.Root maxH="420px">
                  <ScrollArea.Viewport>
                    <ScrollArea.Content>
                      <VStack gap={2} align="stretch" pr={2}>
                        {revisions?.map((revision, index) => (
                          <RevisionRow
                            key={revision.id}
                            revision={revision}
                            isCurrent={index === 0}
                            isRestoring={restore.isPending}
                            onRestore={() => restore.mutate(revision.id)}
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

function RevisionRow({
  revision,
  isCurrent,
  isRestoring,
  onRestore,
}: {
  revision: AnswerRevision;
  /** The newest revision is what the answer says now — nothing to restore to. */
  isCurrent: boolean;
  isRestoring: boolean;
  onRestore: () => void;
}) {
  return (
    <VStack
      align="stretch"
      gap={1.5}
      px={3.5}
      py={3}
      bg="bg.panel"
      borderRadius="sm"
      borderLeft="2px solid"
      borderLeftColor={isCurrent ? "green.solid" : "border"}
    >
      <Flex justify="space-between" align="center" gap={2} flexWrap="wrap">
        <HStack gap={1.5} flexWrap="wrap">
          <Text fontSize="12px" color="fg" fontWeight="500">
            {revision.actor === "client"
              ? "The client"
              : (revision.changedBy ?? "A colleague")}
          </Text>
          <Text fontSize="11px" color="fg.muted" title={formatDateTime(revision.createdAt)}>
            {fromNow(revision.createdAt)} · save {revision.versionNumber}
          </Text>
          {isCurrent && (
            <Badge size="sm" variant="subtle" colorPalette="green" fontSize="10px">
              current
            </Badge>
          )}
        </HStack>

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
            Restore this value
          </Button>
        )}
      </Flex>

      <HStack gap={2} align="center" flexWrap="wrap">
        <StoredValueText value={revision.previousValue} muted strike />
        <ArrowRight size={11} color="currentColor" />
        <StoredValueText value={revision.value} />
      </HStack>
    </VStack>
  );
}
