import type {
  CaseForm,
  CaseFormField,
  FormCorrection,
} from "@/api/case-details";
import {
  useAddCaseForm,
  useCaseFormFields,
  useCaseFilingPackagePdf,
  useCaseForms,
  usePopulateCaseForms,
  usePublishedForms,
  useRemoveCaseForm,
  useSetCaseFormField,
  useSetCaseFormFields,
  useApproveFilingReview,
  useCommentOnCorrection,
  useFilingReview,
  useRaiseCorrection,
  useReopenCorrection,
  useResolveCorrection,
  useRequestFilingReview,
} from "@/hooks/use-case-details";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import {
  changedEntries,
  fieldName,
  useDraftForm,
  type DraftForm,
} from "@/components/questionnaire/use-draft-form";
import useUnsavedChangesPrompt from "@/hooks/useUnsavedChangesPrompt";
import { fromInputValue, toInputValue } from "@/utils/answer-value";
import {
  Box,
  Button,
  Dialog,
  Flex,
  HStack,
  IconButton,
  Menu,
  Portal,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  CheckCircle2,
  FileDown,
  Maximize2,
  Minimize2,
  MoreVertical,
  Plus,
  Send,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MutableRefObject } from "react";
import { STICKY_OFFSET_VAR } from "@/components/layout/shared/chrome";
import { useFormState } from "react-hook-form";
import {
  RailStatusBadge,
  SectionRail,
} from "@/components/questionnaire/section-rail";
import { AddFormDialog } from "./add-form-dialog";
import { FieldHistoryDialog } from "./field-history-dialog";
import { FormView } from "./form-view";
import { ProvidedForm } from "./provided-form";
import { FormHistoryPanel } from "./form-history-panel";
import { PopulateDialog } from "./populate-dialog";
import { packageAction } from "./review/package-action";
import { ReviewPanel } from "./review/review-panel";
import { CorrectionNoteDialog } from "./review/correction-note-dialog";

/**
 * The matter's forms and what is on them.
 *
 * The Workflow tab is the work of preparing a filing; this is the filing
 * itself. Each form's contents come from the case questionnaire, so most of
 * what a paralegal does here is read and correct rather than type.
 *
 * ─── One view, because there is one job here ────────────────────────────────
 *
 * This tab used to carry three: *Contents*, *Field sources* and *PDF boxes*.
 * The last two were never about this matter — a field source and a box mapping
 * are properties of the form, and one row of either decides the answer for
 * every firm in the deployment. They were reachable with `cases:update`, which
 * made a global change look like a local one. Both now live in Oravanti's CRM,
 * and with one view left the segmented control that chose between them is
 * furniture.
 *
 * What a firm does here is what it always actually did: read a form, correct
 * it, populate it, print it. The catalogue behind it is read-only — a form is a
 * government blank, and nobody but the government changes what is on it.
 *
 * ─── Where drafts live ──────────────────────────────────────────────────────
 *
 * Here, not in the rows, and for the same reasons as the questionnaire tab:
 * Save works on a whole form, and the navigation guard has to answer "is
 * anything unsaved?" before letting someone leave.
 */
export function FormsTab({
  caseId,
  isActive,
}: {
  caseId: string;
  isActive: boolean;
}) {
  const { data, isLoading } = useCaseForms(caseId, isActive);
  const populate = usePopulateCaseForms(caseId);
  const packagePdf = useCaseFilingPackagePdf(caseId);

  const forms = useMemo(() => data?.forms ?? [], [data]);
  const [selected, setSelected] = useState<string | null>(null);
  /**
   * Whether the open form is being edited rather than read.
   *
   * A form is opened to be checked far more often than to be changed, so the
   * document is the resting state and editing is entered deliberately. Leaving
   * a form or a view drops back to reading, so nobody arrives at a form they
   * did not choose to edit already open for editing.
   */
  const [isEditingValues, setIsEditingValues] = useState(false);
  const [populateOpen, setPopulateOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyField, setHistoryField] = useState<CaseFormField | null>(null);
  const [addFormOpen, setAddFormOpen] = useState(false);

  /*
    An existing mark being resolved or reopened.

    Raising one has no dialog: it happens beside the box it is about, in
    *Review on the form*, because a review is reading the filing as it prints
    and a dialog covers the thing being talked about. Answering one is a
    different job — it is reached from the panel above the forms, where the
    package's state is changed rather than the paper read.
  */
  const [answering, setAnswering] = useState<{
    correction: FormCorrection;
    mode: "resolve" | "reopen";
  } | null>(null);

  // Where the person was going when the guard stopped them, so accepting the
  // warning can complete the move rather than merely dismissing the dialog.
  const [pendingNav, setPendingNav] = useState<
    | { kind: "form"; code: string }
    // Leaving the editor for the document is a move like any other, and drops
    // the same drafts, so it goes through the same guard rather than a second
    // dialog that says the same thing.
    | { kind: "read" }
    | null
  >(null);

  const activeFormCode = selected ?? forms[0]?.formCode ?? null;
  const activeForm = forms.find((f) => f.formCode === activeFormCode) ?? null;

  const addForm = useAddCaseForm(caseId);
  const removeForm = useRemoveCaseForm(caseId);
  const { data: publishedForms } = usePublishedForms(addFormOpen);
  const { showConfirm } = useConfirmDialog();

  /*
    Taking a form off a matter asks first.

    It takes everything filled in on it, it is not undoable, and it triggers
    from an icon sitting inches from Edit. The catalogue entry is untouched —
    it is Oravanti's, and other firms are still filing the form.
  */
  const confirmRemoveForm = (form: CaseForm) =>
    showConfirm({
      title: `Remove ${form.formCode}`,
      description: `${form.formCode} will be taken off this matter, along with everything filled in on it. The form itself stays in Oravanti's catalogue and can be added again. This cannot be undone.`,
      confirmLabel: "Remove form",
      cancelLabel: "Cancel",
      onConfirm: () =>
        removeForm.mutate(form.formCode, {
          // The rail falls back to the first form. Without this the selection
          // still names the one just removed, and the pane waits forever for a
          // form that is gone.
          onSuccess: () => setSelected(null),
        }),
    });

  /**
   * The rail's own shape.
   *
   * Both numbers and the status, because a form answers two different questions
   * — "how much is left to fill?" and "where is it with USCIS?" — and neither
   * substitutes for the other. A form can be complete and unfiled, or filed and
   * still missing a field somebody added afterwards.
   */
  const railForms = useMemo(
    () =>
      forms.map((form) => ({
        id: form.formCode,
        // The code first, because that is what a paralegal says out loud and
        // what USCIS prints. The title tells somebody new what an I-864 is.
        title: form.definition
          ? `${form.formCode} — ${form.definition.title}`
          : form.formCode,
        answered: form.completion.populated,
        total: form.completion.total,
        requiredAnswered: form.completion.requiredPopulated,
        requiredTotal: form.completion.requiredTotal,
        meta: (
          <RailStatusBadge
            status={form.status.replace(/_/g, " ")}
            colorPalette={statusPalette(form.status)}
          />
        ),
      })),
    [forms],
  );

  const { data: contents, isLoading: isLoadingFields } = useCaseFormFields(
    caseId,
    activeFormCode ?? "",
    Boolean(activeFormCode),
  );
  const saveFields = useSetCaseFormFields(caseId, activeFormCode ?? "");
  const saveField = useSetCaseFormField(caseId, activeFormCode ?? "");
  const isSaving = saveFields.isPending;

  // ─── The attorney's review ────────────────────────────────────────────────

  const { data: review } = useFilingReview(caseId);
  const requestReview = useRequestFilingReview(caseId);
  const approveReview = useApproveFilingReview(caseId);
  const raise = useRaiseCorrection(caseId);
  const resolve = useResolveCorrection(caseId);
  const reopen = useReopenCorrection(caseId);
  const comment = useCommentOnCorrection(caseId);

  const isReviewBusy = requestReview.isPending || approveReview.isPending;

  /** What this person is here to do to the package — see `packageAction`. */
  const primaryAction = review ? packageAction(review) : null;

  /**
   * Everything but this tab, out of the way.
   *
   * A fixed overlay rather than anything the shell has to know about: the shell
   * draws the nav, the case header and the tab strip, and none of them should
   * grow a prop about a mode one tab has. `--sticky-offset` goes to zero with
   * it, because the sticky rail and the unsaved bar are clearing chrome that is
   * no longer there — see `chrome.ts`.
   */
  const [isFocused, setIsFocused] = useState(false);
  useEffect(() => {
    if (!isFocused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFocused(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFocused]);

  /**
   * Whether the forms list is folded away.
   *
   * Folded automatically when a document view opens — a rendered Letter page
   * has little width to spare and reading the filing is what that view is for —
   * and put back when it closes. An action rather than derived state, so the
   * toggle stays truthful: somebody who wants the list back while the page is
   * up can have it.
   */
  const [isRailCollapsed, setIsRailCollapsed] = useState(false);

  /** This form's marks. The panel above shows the package's; the form shows its own. */
  const formCorrections = useMemo(
    () =>
      (review?.corrections ?? []).filter(
        (correction) => correction.formCode === activeFormCode,
      ),
    [review, activeFormCode],
  );

  /**
   * Saving one field.
   *
   * Reads the draft rather than taking a value, so the row and the form-wide
   * Save write exactly the same thing through exactly the same conversion —
   * two paths that turn a draft string into an answer differently is how a
   * date ends up saved as text on one of them.
   */
  const saveOneField = (field: CaseFormField) => {
    const draft = valuesForm.getValues()[fieldName(field.fieldKey)];
    saveField.mutate(
      {
        fieldKey: field.fieldKey,
        value: fromInputValue(draft, field.type),
      },
      {
        onSuccess: () =>
          valuesForm.resetField(fieldName(field.fieldKey), {
            defaultValue: draft,
          }),
      },
    );
  };

  const fieldsByKey = useMemo(() => {
    const map = new Map<string, CaseFormField>();
    for (const field of contents?.fields ?? []) map.set(field.fieldKey, field);
    return map;
  }, [contents]);

  // The catalogue arrives in the form's own order, so grouping by part
  // preserves it — Part 1 before Part 3 without sorting on a label.
  const contentParts = useMemo(
    () => groupByPart(contents?.fields ?? []),
    [contents],
  );

  /*
    One draft, keyed by field key and seeded from what the server returned, so
    a population run or a colleague's edit reaches any row nobody is working in
    — see `useDraftForm`.
  */
  const storedValues = useMemo(() => {
    const values: Record<string, string> = {};
    for (const field of contents?.fields ?? []) {
      values[field.fieldKey] = toInputValue(field.value);
    }
    return values;
  }, [contents]);

  const valuesForm = useDraftForm(storedValues);

  /**
   * Whether anything is unsaved — read, never subscribed to.
   *
   * This container used to call `useFormState` on the draft and keep
   * `isDirty` in a variable, on the reasoning that it flips only once. It does,
   * but *once each way*: typing the first character of an empty field and
   * deleting it again both flip it, and each flip re-rendered the container and
   * with it the entire form beneath — which on a five-hundred-field I-485 is
   * exactly the stall people reported when a box went from empty to filled.
   *
   * So the subscription lives in `UnsavedGuard`, a leaf, and leaves the answer
   * in this ref. Every reader of it is an event handler — a click on another
   * form or on Done — so the ref is always settled by the time it is read.
   */
  const dirtyRef = useRef(false);
  const isDirty = () => dirtyRef.current;

  const clearDrafts = () => {
    valuesForm.reset();
    // Discarding an edit puts the form back the way it was, which includes
    // putting it back to being read rather than typed into.
    setIsEditingValues(false);
  };

  /**
   * Save the open form: only what changed.
   *
   * `onSaved` runs on success alone, so a save that fails leaves the drafts on
   * screen and the person where they were — the one moment losing them would be
   * least forgivable. It is also what decides whether the editor closes: a
   * plain Save is a checkpoint partway down a 351-field form and leaves it
   * open, while *Save & done* passes `stopEditing` and hands the form back to
   * being read.
   */
  const save = (onSaved?: () => void) => {
    saveFields.mutate(
      changedEntries(valuesForm).map(({ key, value }) => ({
        fieldKey: key,
        value: fromInputValue(
          value,
          fieldsByKey.get(key)?.type ?? "short_text",
        ),
      })),
      {
        onSuccess: () => {
          // Reset to what was just saved, so the fields go clean without
          // waiting on the refetch to land. `keepDirtyValues` lets the
          // server's copy arrive later without disturbing anything typed since.
          valuesForm.reset(valuesForm.getValues());
          onSaved?.();
        },
      },
    );
  };

  /** Complete whatever move the guard interrupted, then let the drafts go. */
  const proceedWithNav = () => {
    if (!pendingNav) return;
    if (pendingNav.kind === "form") setSelected(pendingNav.code);
    // Every completed move ends up reading, "read" included. Without this, a
    // form left while editing came back open for editing.
    setIsEditingValues(false);
    clearDrafts();
    setPendingNav(null);
  };

  const goToForm = (code: string) => {
    if (code === activeFormCode) return;
    if (isDirty()) {
      setPendingNav({ kind: "form", code });
      return;
    }
    setSelected(code);
    setIsEditingValues(false);
  };

  /** Back to the document, guarded the same way leaving the form is. */
  const stopEditing = () => {
    if (isDirty()) {
      setPendingNav({ kind: "read" });
      return;
    }
    setIsEditingValues(false);
  };

  if (isLoading) {
    return (
      <Flex justify="center" py={10}>
        <Spinner size="sm" />
      </Flex>
    );
  }

  return (
    <Box
      {...(isFocused
        ? {
            position: "fixed" as const,
            inset: 0,
            zIndex: 20,
            bg: "bg",
            overflowY: "auto" as const,
            px: { base: 4, md: 6 },
            py: 4,
            style: { [STICKY_OFFSET_VAR]: "0px" } as CSSProperties,
          }
        : {})}
    >
      <Flex
        justify="space-between"
        align="flex-start"
        mb={4}
        gap={4}
        flexWrap="wrap"
      >
        <Box>
          <Text fontSize="16px" fontWeight="500" color="fg" lineHeight="20px">
            Forms
          </Text>
          <Text fontSize="13px" color="fg.muted" mt={0.5}>
            {data?.progress.approved ?? 0} of {forms.length} approved
            {data?.progress.outstanding.length
              ? ` · still to file: ${data.progress.outstanding.join(", ")}`
              : ""}
          </Text>
        </Box>

        {/*
          The package's actions, in one place and ranked.

          They used to be three equal outline buttons here plus two more inside
          the review panel below — five controls over one filing, at two levels,
          none of them the obvious next thing to do. The one that *is* the next
          thing depends on who is looking: the team sends a package for review,
          the attorney approves it. That one is solid; the rest are the ⋮.
        */}
        <HStack gap={2}>
          {primaryAction && (
            <Button
              layerStyle="brand-button"
              size="xs"
              h="36px"
              px={4}
              fontSize="13px"
              fontWeight="400"
              loading={isReviewBusy}
              disabled={primaryAction.isDisabled}
              onClick={() =>
                primaryAction.kind === "approve"
                  ? approveReview.mutate(undefined)
                  : requestReview.mutate(undefined)
              }
            >
              {primaryAction.kind === "approve" ? (
                <CheckCircle2 size={13} />
              ) : (
                <Send size={13} />
              )}
              {primaryAction.label}
            </Button>
          )}

          <Menu.Root>
            <Menu.Trigger asChild>
              <IconButton
                aria-label="More actions for this filing package"
                size="xs"
                variant="outline"
                borderColor="border"
                h="36px"
                w="36px"
                color="fg.muted"
              >
                <MoreVertical size={15} />
              </IconButton>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="add" onClick={() => setAddFormOpen(true)}>
                    <Plus size={13} />
                    Add form
                  </Menu.Item>
                  <Menu.Item
                    value="populate"
                    onClick={() => setPopulateOpen(true)}
                  >
                    <Wand2 size={13} />
                    Fill from questionnaire
                  </Menu.Item>
                  <Menu.Item
                    value="download"
                    disabled={forms.length === 0 || packagePdf.isPending}
                    onClick={() => packagePdf.mutate()}
                  >
                    <FileDown size={13} />
                    Download package
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>

          {/* Everything outside this tab — the shell's nav, the case header,
              the tab strip — is chrome once somebody is working down a
              351-field form or reading a page of it against the paper. */}
          <IconButton
            aria-label={isFocused ? "Leave focus mode" : "Focus on the forms"}
            size="xs"
            variant="ghost"
            h="36px"
            w="36px"
            color="fg.muted"
            _hover={{ bg: "bg.emphasized/50", color: "fg" }}
            onClick={() => setIsFocused((was) => !was)}
          >
            {isFocused ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </IconButton>
        </HStack>
      </Flex>

      {review && forms.length > 0 && (
        <ReviewPanel
          review={review}
          onSelectForm={goToForm}
          onResolve={(correction) =>
            setAnswering({ correction, mode: "resolve" })
          }
          onReopen={(correction) =>
            setAnswering({ correction, mode: "reopen" })
          }
          onComment={(correction, body) =>
            comment.mutate({ correctionId: correction.id, body })
          }
        />
      )}

      {forms.length === 0 ? (
        <Box
          border="1px dashed"
          borderColor="border"
          borderRadius="md"
          px={5}
          py={8}
          textAlign="center"
        >
          <Text fontSize="13px" color="fg.muted">
            This matter has no forms yet. The filing package is set up from the
            workflow template, so it appears once the case has a team and a
            workflow — or add one above.
          </Text>
        </Box>
      ) : (
        <>
          <Flex
            gap={5}
            align="flex-start"
            direction={{ base: "column", lg: "row" }}
          >
            <SectionRail
              items={railForms}
              activeId={activeFormCode}
              onSelect={goToForm}
              collapse={{
                isCollapsed: isRailCollapsed,
                onToggle: () => setIsRailCollapsed((was) => !was),
              }}
            />

            <Box flex={1} minW={0} w="full">
              {!activeForm || isLoadingFields ? (
                <Flex justify="center" py={8}>
                  <Spinner size="sm" />
                </Flex>
              ) : activeForm.definition?.providedBy ? (
                /*
                  A form somebody outside the firm completes — the I-693, signed
                  and sealed by a civil surgeon. Checked before both branches
                  below, because neither reading nor editing is a thing anybody
                  does to it here. See `ProvidedForm`.
                */
                <ProvidedForm
                  form={activeForm}
                  instruction={activeForm.definition.providedBy}
                />
              ) : (
                <FormView
                  // Remounted per form, so one form's choice of part or of the
                  // PDF does not carry over to the next.
                  key={activeForm.formCode}
                  caseId={caseId}
                  form={activeForm}
                  parts={contentParts}
                  completion={
                    contents?.completion ?? {
                      populated: 0,
                      total: 0,
                      percentage: 0,
                      missingRequired: [],
                    }
                  }
                  draftForm={valuesForm}
                  isEditing={isEditingValues}
                  onEdit={() => setIsEditingValues(true)}
                  onSave={() => save()}
                  onSaveAndDone={() => save(() => setIsEditingValues(false))}
                  // A rendered Letter page has little width to spare, and
                  // reading the filing is what that view is for.
                  onDocumentOpen={setIsRailCollapsed}
                  onDiscard={clearDrafts}
                  onDone={stopEditing}
                  isSaving={isSaving}
                  onRemoveForm={() => confirmRemoveForm(activeForm)}
                  onFormHistory={() => setHistoryOpen(true)}
                  onFieldHistory={setHistoryField}
                  corrections={formCorrections}
                  canMark={review?.canReview ?? false}
                  isMarking={raise.isPending}
                  // The anchor is the field's key, whichever box on the page was
                  // clicked: a box is where a datum prints, and the datum is
                  // what somebody then has to fix.
                  onMarkField={(field, { color, note }) =>
                    raise.mutate({
                      caseFormId: activeForm.id,
                      partLabel: null,
                      fieldKey: field.fieldKey,
                      color,
                      note,
                    })
                  }
                  onComment={(correction, body) =>
                    comment.mutate({ correctionId: correction.id, body })
                  }
                  onSaveField={saveOneField}
                  savingFieldKey={
                    saveField.isPending
                      ? (saveField.variables?.fieldKey ?? null)
                      : null
                  }
                />
              )}
            </Box>
          </Flex>
        </>
      )}

      <CorrectionNoteDialog
        open={answering !== null}
        onOpenChange={(open) => !open && setAnswering(null)}
        mode={answering?.mode ?? "resolve"}
        isPending={resolve.isPending || reopen.isPending}
        onSubmit={(note) => {
          if (!answering) return;
          const run = answering.mode === "resolve" ? resolve : reopen;
          run.mutate(
            { correctionId: answering.correction.id, note },
            { onSuccess: () => setAnswering(null) },
          );
        }}
      />

      <UnsavedGuard control={valuesForm.control} dirtyRef={dirtyRef} />

      <UnsavedFormDialog
        open={pendingNav !== null}
        control={valuesForm.control}
        isSaving={isSaving}
        onGoBack={() => setPendingNav(null)}
        onDiscard={proceedWithNav}
        onSave={() => save(proceedWithNav)}
      />

      <AddFormDialog
        forms={publishedForms ?? []}
        onList={forms.map((form) => form.formCode)}
        open={addFormOpen}
        onOpenChange={setAddFormOpen}
        isPending={addForm.isPending}
        onSubmit={async (formCode, role) => {
          await addForm.mutateAsync({ formCode, role });
          setSelected(formCode);
          setAddFormOpen(false);
        }}
      />

      {activeFormCode && (
        <>
          <FormHistoryPanel
            caseId={caseId}
            formCode={activeFormCode}
            open={historyOpen}
            onOpenChange={setHistoryOpen}
          />

          <FieldHistoryDialog
            caseId={caseId}
            formCode={activeFormCode}
            fieldKey={historyField?.fieldKey ?? null}
            fieldLabel={historyField?.label ?? ""}
            open={historyField !== null}
            onOpenChange={(open) => !open && setHistoryField(null)}
          />
        </>
      )}

      <PopulateDialog
        caseId={caseId}
        open={populateOpen}
        onOpenChange={setPopulateOpen}
        isPending={populate.isPending}
        onConfirm={(overrideManual) =>
          populate.mutate(
            { overrideManual },
            {
              onSuccess: () => {
                setPopulateOpen(false);
                // A run can move values under an open form; drafts describing
                // the old ones would silently reinstate them on the next save.
                clearDrafts();
              },
            },
          )
        }
      />
    </Box>
  );
}

/**
 * The form's own divisions, in the order the catalogue returns them.
 *
 * Shared by both views because both render the same form — Part 1 before
 * Part 3 without either of them sorting on a label.
 */
function groupByPart<T extends { partLabel: string | null }>(fields: T[]) {
  const grouped: { partLabel: string | null; fields: T[] }[] = [];
  for (const field of fields) {
    const last = grouped[grouped.length - 1];
    if (last && last.partLabel === field.partLabel) last.fields.push(field);
    else grouped.push({ partLabel: field.partLabel, fields: [field] });
  }
  return grouped;
}

/** Where a form stands, at a glance: done, refused, queried, or in motion. */
function statusPalette(status: CaseForm["status"]) {
  if (status === "approved") return "green";
  if (status === "denied") return "red";
  if (status === "rfe") return "orange";
  if (status === "not_started") return "gray";
  return "blue";
}

/**
 * Who is subscribed to "is anything unsaved?".
 *
 * A component of its own, rendering nothing, because the answer changes on the
 * first keystroke into an empty field and again when that field is emptied —
 * and anything that re-renders when it changes re-renders the whole form. This
 * is the only thing that does.
 *
 * It carries two jobs, both of which need the live answer: the route-change
 * guard, and the ref the tab's own navigation reads on click. Only the view
 * currently open can be dirty — the tab will not let you leave a dirty one — so
 * subscribing to the active draft alone is the whole picture.
 */
function UnsavedGuard({
  control,
  dirtyRef,
}: {
  control: DraftForm["control"];
  dirtyRef: MutableRefObject<boolean>;
}) {
  const { isDirty } = useFormState({ control });

  // In an effect rather than during render: writing a ref while rendering is a
  // side effect, and there is nothing to gain from it here. Every reader is a
  // click, which happens long after the effect has run.
  useEffect(() => {
    dirtyRef.current = isDirty;
  }, [isDirty, dirtyRef]);

  // Leaving the page is a route change, which the app already guards centrally.
  useUnsavedChangesPrompt({
    when: isDirty,
    title: "Unsaved form edits",
    description:
      "Some changes on this form have not been saved. Leaving now discards them.",
  });

  return null;
}

/**
 * The warning shown when a form or view switch would drop unsaved edits.
 *
 * Offers the save as well as the discard, because losing the work is almost
 * never what the person meant and making them cancel, save, and navigate again
 * is three steps to reach the obvious one.
 */
function UnsavedFormDialog({
  open,
  control,
  isSaving,
  onGoBack,
  onDiscard,
  onSave,
}: {
  open: boolean;
  /** The open view's draft form, so the dialog counts what is unsaved itself. */
  control: DraftForm["control"];
  isSaving: boolean;
  onGoBack: () => void;
  onDiscard: () => void;
  onSave: () => void;
}) {
  const { dirtyFields } = useFormState({ control });
  const count = Object.keys(dirtyFields).length;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => !e.open && onGoBack()}
      size="sm"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header pb={2}>
              <Dialog.Title fontSize="15px" fontWeight="500">
                Unsaved form edits
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body pb={4}>
              <Text fontSize="13px" color="fg.muted" lineHeight="18px">
                {count} field{count === 1 ? " has" : "s have"} been changed but
                not saved. Moving on now discards {count === 1 ? "it" : "them"}.
              </Text>
            </Dialog.Body>
            <Dialog.Footer pt={0} pb={5}>
              <VStack align="stretch" gap={2} w="full">
                <Button
                  layerStyle="brand-button"
                  size="sm"
                  fontSize="13px"
                  loading={isSaving}
                  onClick={onSave}
                >
                  Save and continue
                </Button>
                <HStack gap={2} justify="flex-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    fontSize="13px"
                    fontWeight="400"
                    color="fg.error"
                    onClick={onDiscard}
                  >
                    Discard changes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="border"
                    fontSize="13px"
                    fontWeight="400"
                    onClick={onGoBack}
                  >
                    Go back
                  </Button>
                </HStack>
              </VStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
