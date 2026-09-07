import type { CatalogueForm } from "@/api/platform";
import {
  SubmitWhenValid,
  TextAreaField,
  TextField,
} from "@/components/ui/bound-fields";
import { Button, Dialog, Portal, Text, VStack } from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { FiledOnPicker, type PickedArea } from "./filed-on-picker";

/**
 * Name a form, or reword one.
 *
 * The counterpart of the questionnaire's section dialog, and deliberately the
 * same three controls: a code, a name, and a sentence saying what the form is
 * for. The fields on it are added from the form itself, not from here.
 *
 * `formCode` is asked once and never again. It is the identity every value,
 * every mapping and every filing is keyed by, so renaming it would orphan all
 * three — which is why editing shows it as settled text rather than as an input
 * somebody could change by accident.
 *
 * There is one row per form and every firm reads it, so a rewording here is a
 * rewording everywhere. That is the point of the tier: the catalogue is
 * Oravanti's, and a firm has no version of its own to diverge.
 */

type Values = {
  formCode: string;
  title: string;
  description: string;
  providedBy: string;
};

/**
 * What a code may be, and why it is this loose.
 *
 * It used to be `^[A-Z]{1,4}-\d{1,4}[A-Z]?$` — immigration's house style,
 * written down as a law. Oravanti is not only an immigration product, and that
 * pattern rejects `1040`, `FL-341(E)`, `AOC-CV-100` and `SAPCR`: real codes on
 * real forms in tax, California family law, North Carolina courts and Texas
 * family law.
 *
 * The code is not a label, which is why there is still a rule. It is the join
 * key — `form_code` is matched by value across eight tables, it is this page's
 * URL, it is part of the uploaded PDF's storage path, and it is compacted to
 * name every field read off that PDF. So it has to start with a letter or
 * digit, avoid slashes and spaces, and be short enough to read.
 *
 * Mirrors the server, which also refuses a code that compacts to one already
 * catalogued — `FL-100` and `FL100` are one namespace, and that is a check
 * needing the database rather than a pattern.
 */
const FORM_CODE = /^[A-Z0-9][A-Z0-9.\-()]{0,23}$/;

export function FormDefinitionDialog({
  form,
  practiceAreas,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  /** Present when rewording; absent when adding. */
  form?: CatalogueForm | null;
  /**
   * The practice areas already stored against the form, when rewording one.
   *
   * Needed rather than optional-in-spirit: the picker replaces the whole set,
   * so opening it empty and saving would silently clear a classification
   * somebody made — on a screen they opened to fix a typo in the title.
   */
  practiceAreas?: { id: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: {
    formCode: string;
    title: string;
    description: string | null;
    providedBy: string | null;
    practiceAreaIds?: string[];
  }) => Promise<unknown>;
  isPending: boolean;
}) {
  const isEdit = Boolean(form);

  /*
    Which practice areas the form is for.

    Not part of the react-hook-form draft, because it is not a column on
    `form_definitions`: a form belongs to several areas, so it is rows in
    `form_practice_areas`.

    Offered when editing as well as when adding, unlike the filing package. The
    difference is ownership: a package belongs to the matter type and is edited
    there, so a second door onto it here would be two screens over one set of
    rows — while `form_practice_areas` has no other screen at all. Add-only
    would make a mis-click permanent, which is the kind of dead end this tier
    keeps finding.
  */
  const [filedOn, setFiledOn] = useState<PickedArea[]>([]);

  /**
   * Re-seeded from the form whenever a different one is opened.
   *
   * `values` is react-hook-form's own re-seed and it applies while rendering,
   * so the boxes are right on the first painted frame instead of flashing the
   * previous form's. Memoized because a fresh object every render would re-seed
   * on every render and throw away what is being typed.
   */
  const values = useMemo(
    () => ({
      formCode: form?.formCode ?? "",
      title: form?.title ?? "",
      description: form?.description ?? "",
      providedBy: form?.providedBy ?? "",
    }),
    [form?.formCode, form?.title, form?.description, form?.providedBy],
  );

  // `onChange` so `SubmitWhenValid` can see validity as it is typed.
  const { control, getValues, reset } = useForm<Values>({
    defaultValues: values,
    values,
    mode: "onChange",
  });

  /*
    Reopening the same form starts from what is stored, not from edits that were
    abandoned last time. `values` cannot do this on its own: it re-seeds when
    the form changes, and reopening the same one changes nothing.

    Seeded on the *opening*, not whenever the inputs change. The caller builds
    `practiceAreas` from a query result, so it is a new array on every render
    even when it holds the same areas; seeding on every run would throw away the
    chips somebody had just picked.
  */
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      reset(values);
      setFiledOn(practiceAreas ?? []);
    }
    wasOpen.current = open;
  }, [open, reset, values, practiceAreas]);

  const handleSave = async () => {
    const draft = getValues();
    await onSubmit({
      formCode: draft.formCode.trim(),
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      providedBy: draft.providedBy.trim() || null,
      practiceAreaIds: filedOn.map((a) => a.id),
    });
    onOpenChange(false);
  };

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
            maxW="420px"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            bg="bg"
          >
            <Dialog.Header>
              <Dialog.Title fontSize="14px" fontWeight="600">
                {isEdit ? "Edit form" : "Add a form"}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3.5} align="stretch">
                <Text fontSize="12px" color="fg.muted" lineHeight="17px">
                  {isEdit
                    ? "Every firm sees this wording. Anything already filled in on a matter stays as it is."
                    : "Every firm will see this form. Next you'll upload the blank PDF, and its questions are read off that."}
                </Text>

                <TextField
                  control={control}
                  name="formCode"
                  label="Form code"
                  mono
                  autoFocus={!isEdit}
                  disabled={isEdit}
                  placeholder="I-601"
                  transform={(value) => value.toUpperCase()}
                  // Not validated while editing: the box is settled text there,
                  // and a legacy code that predates this pattern must still save.
                  rules={
                    isEdit
                      ? undefined
                      : {
                          required: "A form code is needed.",
                          pattern: {
                            value: FORM_CODE,
                            message:
                              "Use letters, digits and - . ( ) — up to 24 characters, starting with a letter or digit. No spaces or slashes.",
                          },
                        }
                  }
                  hint={
                    isEdit
                      ? "This can't be changed. Everything filled in on a matter is stored against it."
                      : "Exactly as it is printed on the form — I-485, FL-100, 1040, SAPCR. This can't be changed later."
                  }
                />

                <TextField
                  control={control}
                  name="title"
                  label="Full name of the form"
                  autoFocus={isEdit}
                  placeholder="Application for Waiver of Grounds of Inadmissibility"
                  rules={{ required: "A name is needed." }}
                />

                <TextAreaField
                  control={control}
                  name="description"
                  label="What it is for (optional)"
                  placeholder="One sentence, shown to staff so they know what this form is for."
                />

                {/*
                  The one field here that changes behaviour rather than wording.
                  Filling it takes the form out of every firm filing package and
                  out of every populate run, which is why the hint says so
                  rather than describing the box.
                */}
                <TextAreaField
                  control={control}
                  name="providedBy"
                  label="Filled in by someone outside the firm (optional)"
                  placeholder="e.g. Completed and sealed by a USCIS-designated civil surgeon. Do not open the envelope."
                  hint="Leave this empty for a form the firm fills in itself. If you write anything here, nobody at a firm can fill in or print this form, and it is left out of the combined PDF — staff see your instructions instead."
                />

                <FiledOnPicker picked={filedOn} onChange={setFiledOn} />
              </VStack>
            </Dialog.Body>

            <Dialog.Footer gap={2}>
              <Dialog.ActionTrigger asChild>
                <Button
                  variant="outline"
                  borderColor="border"
                  size="sm"
                  fontSize="12px"
                  h="32px"
                >
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <SubmitWhenValid
                control={control}
                isPending={isPending}
                onClick={handleSave}
              >
                {isEdit ? "Save changes" : "Add form"}
              </SubmitWhenValid>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
