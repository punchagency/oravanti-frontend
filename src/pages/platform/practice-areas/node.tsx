import {
  Badge,
  Box,
  Button,
  Dialog,
  HStack,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";

import type { TaxonomyStatus } from "@/api/platform";
import { PlatformPageHeader, type Crumb } from "../page-header";
import {
  SubmitWhenValid,
  TextAreaField,
  TextField,
} from "@/components/ui/bound-fields";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import type { NodeValues } from "./node-values";

/**
 * The parts every taxonomy node's page is built from.
 *
 * A practice area, a subcategory and a case type are three levels of one tree
 * and their pages say the same four things — what this is, whether it is still
 * offered, what sits under it, and how to change it. Writing that three times
 * is how the three drift: one page grows a Restore button, another keeps
 * showing an archived node as though it were live.
 *
 * What is *not* shared is the level-specific vocabulary — a subcategory has a
 * `code`, a case type has a `caseNumberPrefix` and a jurisdiction — so the
 * dialog below takes those as children rather than pretending three different
 * forms are one.
 */

/**
 * Says that a node is no longer offered, and nothing at all when it is.
 *
 * Archiving is invisible from the firm's side by design — the node simply stops
 * appearing when a new matter is opened — so this badge is the only place the
 * state is legible, and it has to be on every screen that can show an archived
 * row.
 */
export function StatusBadge({ status }: { status: TaxonomyStatus }) {
  if (status === "active") return null;

  return (
    <Badge size="sm" variant="subtle" colorPalette="orange">
      Archived
    </Badge>
  );
}

/**
 * A node's own heading: what it is called, what it is, and what can be done
 * to it.
 *
 * `description` is rendered as a paragraph rather than a caption because it is
 * the thing the user asked these pages to carry — an operator wiring a filing
 * package needs the paragraph, not the name.
 */
export function NodeHeading({
  trail,
  title,
  meta,
  description,
  status,
  actions,
}: {
  /** The way back up. Every node has one; only a practice area has a short one. */
  trail: Crumb[];
  title: string;
  /** The identifiers under the name — a code, a jurisdiction, a count. */
  meta?: ReactNode;
  description: string | null;
  status: TaxonomyStatus;
  actions?: ReactNode;
}) {
  return (
    <Box mb={5}>
      <PlatformPageHeader
        trail={trail}
        title={
          <HStack gap={2} align="center" flexWrap="wrap">
            <Text as="span">{title}</Text>
            <StatusBadge status={status} />
          </HStack>
        }
        description={description ?? "No description yet."}
        actions={actions}
      >
        {meta}
      </PlatformPageHeader>

      {status === "archived" && (
        <Box
          mt={1}
          px={3}
          py={2.5}
          borderRadius="md"
          bg="bg.muted"
          border="1px solid"
          borderColor="border.subtle"
          maxW="65ch"
        >
          <Text fontSize="12px" color="fg.muted" lineHeight="17px">
            Archived. Firms can no longer choose this when they open a new
            matter. Everything already filed under it keeps working.
          </Text>
        </Box>
      )}
    </Box>
  );
}

/**
 * Edit, archive or delete — the three things you can do to any node.
 *
 * Delete confirms because it is irreversible, and archive confirms because the
 * question it raises ("what happens to the matters already under this?") has to
 * be answered before the click, not after. Neither confirm is boilerplate: both
 * say what the action does to work already in flight.
 */
export function NodeActions({
  what,
  name,
  status,
  onEdit,
  onSetStatus,
  onDelete,
  isBusy,
}: {
  /** The level, in the words the confirms use: "practice area", "case type". */
  what: string;
  name: string;
  status: TaxonomyStatus;
  onEdit: () => void;
  onSetStatus: (status: TaxonomyStatus) => void;
  onDelete: () => void;
  isBusy?: boolean;
}) {
  const { showConfirm } = useConfirmDialog();
  const isArchived = status === "archived";

  const confirmArchive = () =>
    showConfirm({
      title: `Archive ${name}?`,
      description: `Firms will stop being offered this ${what} when they open a new matter. Every matter, lead and invoice already filed under it keeps working, and you can restore it at any time.`,
      confirmLabel: "Archive",
      onConfirm: () => onSetStatus("archived"),
    });

  const confirmDelete = () =>
    showConfirm({
      title: `Delete ${name}?`,
      description: `This cannot be undone. Deleting is refused if anything references this ${what} — archive it instead when it has history.`,
      confirmLabel: "Delete",
      onConfirm: onDelete,
    });

  return (
    <HStack gap={1.5} flexShrink={0}>
      <Button size="xs" variant="ghost" onClick={onEdit} disabled={isBusy}>
        <Pencil size={13} />
        Edit
      </Button>

      {isArchived ? (
        <Button
          size="xs"
          variant="ghost"
          onClick={() => onSetStatus("active")}
          disabled={isBusy}
        >
          <ArchiveRestore size={13} />
          Restore
        </Button>
      ) : (
        <Button
          size="xs"
          variant="ghost"
          onClick={confirmArchive}
          disabled={isBusy}
        >
          <Archive size={13} />
          Archive
        </Button>
      )}

      <Button
        size="xs"
        variant="ghost"
        colorPalette="red"
        onClick={confirmDelete}
        disabled={isBusy}
      >
        <Trash2 size={13} />
        Delete
      </Button>
    </HStack>
  );
}

/**
 * The dialog behind both New and Edit, at all three levels.
 *
 * `extraFields` is where a level puts what only it has — a subcategory's code,
 * a case type's prefix and jurisdiction — and it renders above the shared two,
 * because a code is the first thing you decide and the description is the last.
 *
 * The caller owns the form. That is what lets one dialog serve six callers with
 * six different value shapes without this file knowing any of them: it renders
 * `name` and `description` off the control it is handed, and the caller reads
 * its own extra fields off the same one.
 */
export function NodeDialog<T extends FieldValues & NodeValues>({
  title,
  submitLabel,
  control,
  extraFields,
  blurb,
  nameLabel = "Name",
  namePlaceholder,
  onSubmit,
  isPending,
  open,
  onOpenChange,
}: {
  title: string;
  submitLabel: string;
  control: Control<T>;
  extraFields?: ReactNode;
  /** One sentence on what creating or changing this does to firms. */
  blurb?: ReactNode;
  nameLabel?: string;
  namePlaceholder?: string;
  onSubmit: () => void;
  isPending: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
      size="sm"
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="480px"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            bg="bg"
          >
            <Dialog.Header>
              <Dialog.Title fontSize="14px" fontWeight="600">
                {title}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3.5} align="stretch">
                {blurb && (
                  <Text fontSize="12px" color="fg.muted" lineHeight="17px">
                    {blurb}
                  </Text>
                )}

                {extraFields}

                {/*
                  Cast because `T` is only known to *extend* `NodeValues`, so
                  TypeScript cannot see that the literal is one of its paths.
                  The constraint is what makes it true; this says so.
                */}
                <TextField
                  control={control}
                  name={"name" as Path<T>}
                  label={nameLabel}
                  placeholder={namePlaceholder}
                  rules={{ required: "A name is needed." }}
                />

                <TextAreaField
                  control={control}
                  name={"description" as Path<T>}
                  label="Description"
                  rows={4}
                  placeholder="What this covers, in a couple of sentences."
                  hint="Shown on its own page. This is what an operator reads before wiring anything to it."
                />
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <SubmitWhenValid
                control={control}
                onClick={onSubmit}
                isPending={isPending}
              >
                {submitLabel}
              </SubmitWhenValid>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
