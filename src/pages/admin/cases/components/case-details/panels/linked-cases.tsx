import { Badge, Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { Link2, Unlink } from "lucide-react";
import { Link } from "react-router";
import type { CaseDetail } from "@/api/cases";
import { useUnlinkCase } from "@/hooks/use-workflows";
import { useConfirmStore } from "@/store/confirm-store";
import { SectionLabel } from "../shared";
import { LinkCaseDialog } from "./link-case-dialog";

const RELATION_LABELS: Record<string, string> = {
  mandamus: "Writ of mandamus",
  appeal: "Appeal",
  related_matter: "Related matter",
};

/** Falls through for a relation type a newer deployment added. */
const relationLabel = (type: string | null) =>
  (type && RELATION_LABELS[type]) ?? type?.replace(/_/g, " ") ?? "Linked";

function LinkedCaseRow({
  caseId,
  caseNumber,
  status,
  relationType,
  direction,
  unlinkCaseId,
}: {
  caseId: string;
  caseNumber: string;
  status: string;
  relationType: string | null;
  direction: "parent" | "child";
  /**
   * Which case the unlink call addresses. Always the CHILD end of the link,
   * because that is where `parentCaseId` is stored — so on the parent row it is
   * the case being viewed, and on a child row it is the row's own case.
   */
  unlinkCaseId: string;
}) {
  const unlink = useUnlinkCase();
  const showConfirm = useConfirmStore((s) => s.showConfirm);

  return (
    <HStack
      justify="space-between"
      gap={2}
      border="1px solid"
      borderColor="border.muted"
      borderRadius="6px"
      px={2.5}
      py={2}
      _hover={{ bg: "bg.subtle" }}
    >
      {/* Only the case itself navigates. The unlink button sits outside the
          anchor — nested in it, every click would follow the link instead. */}
      <HStack asChild gap={2} minW={0} flex={1}>
        <Link to={`/cases/${caseId}`}>
          <Box color="fg.subtle">
            <Link2 size={12} />
          </Box>
          <VStack align="start" gap={0} minW={0}>
            <Text fontSize="12px" fontWeight="500" color="fg" truncate>
              {caseNumber}
            </Text>
            <Text fontSize="10px" color="fg.subtle">
              {direction === "parent"
                ? `This case is the ${relationLabel(relationType).toLowerCase()}`
                : relationLabel(relationType)}
            </Text>
          </VStack>
        </Link>
      </HStack>

      <HStack gap={1.5} flexShrink={0}>
        <Badge
          size="xs"
          borderRadius="full"
          px={2}
          bg="bg.subtle"
          color="fg.muted"
          fontSize="9px"
          fontWeight="500"
          textTransform="none"
        >
          {status}
        </Badge>

        <Button
          variant="ghost"
          size="xs"
          h="22px"
          minW="22px"
          px={1}
          color="fg.subtle"
          _hover={{ color: "red.fg", bg: "red.subtle" }}
          aria-label={`Unlink ${caseNumber}`}
          title={`Unlink ${caseNumber}`}
          loading={unlink.isPending}
          onClick={() =>
            showConfirm({
              title: "Unlink this matter?",
              // Says plainly that nothing is deleted — the wording is the whole
              // reason someone dares press it on a real matter.
              description: `${caseNumber} will no longer be linked to this case. Both matters stay open and nothing else about either one changes.`,
              confirmLabel: "Unlink",
              onConfirm: () => unlink.mutate(unlinkCaseId),
            })
          }
        >
          <Unlink size={11} />
        </Button>
      </HStack>
    </HStack>
  );
}

/**
 * Matters linked to this one, in either direction.
 *
 * Deliberately generic rather than mandamus-only, even though mandamus is the
 * only relation type in use today — `appeal` and `related_matter` already exist
 * in the schema, and one component that reads `relationType` costs nothing over
 * a bespoke one that would need replacing the first time either is used.
 */
export function LinkedCases({ caseDetail }: { caseDetail: CaseDetail | undefined }) {
  if (!caseDetail) return null;

  const { parentCase, linkedCases = [] } = caseDetail;
  const hasLinks = Boolean(parentCase) || linkedCases.length > 0;

  return (
    <Box>
      <HStack justify="space-between" align="center" mb={2}>
        <SectionLabel>Linked matters</SectionLabel>
        {/* A case that already hangs off a parent cannot take children of its
            own — the backend refuses chains — so it gets no link action. */}
        {!parentCase && (
          <LinkCaseDialog parentCaseId={caseDetail.id} />
        )}
      </HStack>

      {!hasLinks ? (
        <Text fontSize="11px" color="fg.subtle">
          No linked matters.
        </Text>
      ) : (
        <VStack align="stretch" gap={2}>
          {parentCase && (
            <LinkedCaseRow
              caseId={parentCase.id}
              caseNumber={parentCase.caseNumber}
              status={parentCase.status}
              relationType={parentCase.relationType}
              direction="parent"
              // This case is the child of that one, so it is the end that holds
              // the link and the end the unlink call names.
              unlinkCaseId={caseDetail.id}
            />
          )}
          {linkedCases.map((linked) => (
            <LinkedCaseRow
              key={linked.id}
              caseId={linked.id}
              caseNumber={linked.caseNumber}
              status={linked.status}
              relationType={linked.relationType}
              direction="child"
              unlinkCaseId={linked.id}
            />
          ))}
        </VStack>
      )}
    </Box>
  );
}
