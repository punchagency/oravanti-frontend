import { Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import { Check, Save, Undo2 } from "lucide-react";
import { useFormState } from "react-hook-form";

import type { DraftForm } from "./use-draft-form";

/**
 * What is unsaved, and the two things to do about it.
 *
 * Sticky, because a long form's Save button is otherwise below the fold exactly
 * when there is most to lose by not finding it. Appears only when there is
 * something to save — or, where `done` is given, whenever the screen is
 * editable — so it costs nothing on a form nobody has touched.
 *
 * One component for the questionnaire's answers, a form's contents and a form's
 * field sources. They are the same promise to the person using them — nothing
 * leaves this screen until you press Save — and three copies of that promise
 * drifted apart the moment one of them was restyled.
 *
 * ─── The count is read here, deliberately ───────────────────────────────────
 *
 * This bar is the only thing on the page that needs to know how much is
 * unsaved, and it is a leaf. Subscribing to `dirtyFields` in the container
 * that renders the rows would re-render every row on every keystroke, which is
 * the exact cost react-hook-form was brought in to remove. Keep the
 * subscription here.
 */
export function UnsavedBar({
  control,
  noun,
  saveLabel = "Save",
  surface = "bg",
  isSaving,
  onSave,
  onDiscard,
  done,
}: {
  /** The form whose unsaved count this bar reports. */
  control: DraftForm["control"];
  /** Singular name for what is unsaved, e.g. "answer", "field", "field source". */
  noun: string;
  saveLabel?: string;
  /**
   * The way out of editing, when this bar is the only place it lives.
   *
   * Passed by a screen that has no *Done editing* of its own — the Forms tab,
   * where a form's state used to be controlled from two levels at once: the
   * header offered ✕ Done editing while this bar offered Discard and Save, so
   * three buttons across two places decided what happened to one draft.
   *
   * Both halves in one object because they are one decision and half of it is
   * a trap: without `onSaveAndDone` the bar has no primary action, and without
   * `onDone` a form with nothing unsaved has no way back to reading at all.
   *
   * Given it, the bar renders whenever the screen is editable rather than only
   * when something is unsaved, because leaving is a thing to do either way.
   */
  done?: { onDone: () => void; onSaveAndDone: () => void };
  /**
   * The surface the bar sits on, so content scrolls *under* it rather than
   * showing through. The client portal's page is `bg.subtle`; the staff tabs
   * sit on `bg`.
   */
  surface?: string;
  isSaving: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const { dirtyFields } = useFormState({ control });
  const count = Object.keys(dirtyFields).length;

  // Nothing to save and nowhere to go: the bar has nothing to say.
  if (count === 0 && !done) return null;

  return (
    <Box
      position="sticky"
      bottom={0}
      mt={3}
      py={3}
      bg={surface}
      borderTop="1px solid"
      borderColor="border"
    >
      <Flex justify="space-between" align="center" gap={3} flexWrap="wrap">
        <Text fontSize="12px" color="fg.muted">
          {count === 0
            ? "Nothing unsaved"
            : `${count} unsaved ${noun}${count === 1 ? "" : "s"}`}
        </Text>
        <HStack gap={2}>
          {count > 0 && (
            <Button
              size="xs"
              variant="ghost"
              h="32px"
              fontSize="13px"
              fontWeight="400"
              color="fg.muted"
              px={3}
              // Ghost hover is `bg.subtle`, which is the colour of the surface
              // this bar sits on in the portal — so hovering did nothing there
              // and looked broken. Stepping the emphasized surface by alpha
              // lands on any background, and the label darkening to `fg` is what
              // actually reads as "this is a button".
              _hover={{ bg: "bg.emphasized/50", color: "fg" }}
              disabled={isSaving}
              onClick={onDiscard}
            >
              <Undo2 size={13} />
              Discard
            </Button>
          )}

          {/* Save keeps you here, because somebody working down 351 fields
              wants a checkpoint rather than an exit. It steps back to an
              outline where there is a *Save & done* beside it — two solid
              buttons is two primary actions, which is none. */}
          {count > 0 && (
            <Button
              layerStyle={done ? undefined : "brand-button"}
              variant={done ? "outline" : undefined}
              borderColor={done ? "border" : undefined}
              color={done ? "fg.muted" : undefined}
              size="xs"
              h="32px"
              fontSize="13px"
              fontWeight="400"
              px={4}
              loading={isSaving}
              onClick={onSave}
            >
              <Save size={13} />
              {saveLabel}
            </Button>
          )}

          {done && (
            <Button
              layerStyle="brand-button"
              size="xs"
              h="32px"
              fontSize="13px"
              fontWeight="400"
              px={4}
              loading={isSaving}
              onClick={count > 0 ? done.onSaveAndDone : done.onDone}
            >
              <Check size={13} />
              {count > 0 ? "Save & done" : "Done editing"}
            </Button>
          )}
        </HStack>
      </Flex>
    </Box>
  );
}
