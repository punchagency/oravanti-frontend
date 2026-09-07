import type {
  CaseQuestion,
  CaseSection,
  QuestionnaireStage,
} from "@/api/questionnaires";
import {
  QuestionDialog,
  type QuestionDialogSubmit,
} from "@/components/questionnaire/question-dialog";
import { SectionDialog } from "@/components/questionnaire/section-dialog";
import {
  RailStatusBadge,
  SectionRail,
} from "@/components/questionnaire/section-rail";
import { SurfaceCard } from "@/components/ui/intake-ui";
import {
  SearchableSelect,
  type SearchableOption,
} from "@/components/ui/searchable-select";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useFirmPracticeAreas } from "@/hooks/use-firm-practice-areas";
import { useHasPermission } from "@/hooks/use-has-permission";
import {
  useAddFirmQuestion,
  useAddFirmSection,
  useDeleteFirmQuestion,
  useDeleteFirmSection,
  useFirmQuestionnaire,
  useUpdateFirmQuestion,
  useUpdateFirmSection,
} from "@/hooks/use-firm-questionnaire";
import { questionTypeLabel } from "@/utils/question-types";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  SegmentGroup,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

/**
 * The firm's standing additions to a case type's questionnaires.
 *
 * Oravanti ships a questionnaire per case type per stage, and a firm may
 * **extend** it but not change it. Both halves of that matter:
 *
 * A questionnaire is a conversation with a client, so a firm has a legitimate
 * reason to ask more than we thought to — its own sections and questions sit
 * beside ours and are fully its own to edit and remove.
 *
 * What it cannot do is reword or delete one of ours. It used to be able to:
 * an edit was stored as a firm-scoped copy that superseded the original for
 * that firm alone. That path is gone, and with it the ambiguity about which
 * question a given answer was given to. A standard row renders here with no
 * Edit and no Delete, and the page says why rather than leaving somebody to
 * discover it by clicking.
 *
 * A question written for a single matter lives on that matter's own
 * Questionnaire tab instead. This page is for the ones a firm always asks.
 */
export function CaseQuestionnairesPage() {
  useDocumentTitle("Case questionnaires");
  const canRead = useHasPermission("workflow", "read");
  const canEdit = useHasPermission("workflow", "update");

  const practiceAreas = useFirmPracticeAreas();
  const [caseTypeId, setCaseTypeId] = useState("");
  const [stage, setStage] = useState<QuestionnaireStage>("case");

  const [questionTarget, setQuestionTarget] = useState<
    CaseQuestion | "new" | null
  >(null);
  const [sectionTarget, setSectionTarget] = useState<CaseSection | "new" | null>(
    null,
  );

  // A firm with several practice areas has dozens of case types, so this is a
  // searchable combobox rather than a plain select. The practice area is the
  // sublabel: two areas can both have a "Consultation" type, and the name
  // alone would not tell them apart.
  const caseTypeOptions = useMemo<SearchableOption[]>(() => {
    const options: SearchableOption[] = [];
    for (const area of practiceAreas.data ?? []) {
      for (const subcategory of area.subcategories) {
        for (const caseType of subcategory.caseTypes) {
          options.push({
            value: caseType.id,
            label: caseType.name,
            sublabel: `${area.name} · ${subcategory.name}`,
          });
        }
      }
    }
    return options;
  }, [practiceAreas.data]);

  const activeCaseTypeId = caseTypeId || caseTypeOptions[0]?.value || "";
  const questionnaire = useFirmQuestionnaire(
    activeCaseTypeId,
    stage,
    canRead && Boolean(activeCaseTypeId),
  );

  const addQuestion = useAddFirmQuestion(activeCaseTypeId, stage);
  const updateQuestion = useUpdateFirmQuestion(activeCaseTypeId, stage);
  const deleteQuestion = useDeleteFirmQuestion(activeCaseTypeId, stage);
  const addSection = useAddFirmSection(activeCaseTypeId, stage);
  const updateSection = useUpdateFirmSection(activeCaseTypeId, stage);
  const deleteSection = useDeleteFirmSection(activeCaseTypeId, stage);

  const sections = useMemo(
    () => questionnaire.data?.sections ?? [],
    [questionnaire.data],
  );
  const { showConfirm } = useConfirmDialog();

  /*
    Which section is on screen.

    Null until somebody chooses, and the first section stands in. Keyed on
    nothing else, so switching case type or stage lands on that questionnaire's
    first section rather than on an id it does not have — the lookup below
    falls through on its own.
  */
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const openSection =
    sections.find((section) => section.id === openSectionId) ?? sections[0];

  /*
    The rail's entries.

    A count of questions rather than a filled/total pair — nobody answers this
    copy; it is what the firm asks, not what one client said. The badge marks
    the firm's *own* sections, which are the few among Oravanti's and the ones
    somebody came to this page to find.
  */
  const railSections = useMemo(
    () =>
      sections.map((section) => ({
        id: section.id,
        title: section.title,
        note: `${section.questions.length} question${section.questions.length === 1 ? "" : "s"}`,
        meta: section.isLocked ? undefined : (
          <RailStatusBadge status="firm" colorPalette="purple" />
        ),
      })),
    [sections],
  );

  /*
    Deletions ask first, and this screen has the widest blast radius of the
    three: these are the firm's standing questionnaires, so removing a section
    here removes it from every matter of this type that has not been sent yet,
    not from one file.
  */
  const confirmDeleteSection = (section: CaseSection) =>
    showConfirm({
      title: "Delete section",
      description: `"${section.title}" and its ${section.questions.length} question${section.questions.length === 1 ? "" : "s"} will be removed from this firm's questionnaire. This cannot be undone.`,
      confirmLabel: "Delete section",
      cancelLabel: "Cancel",
      onConfirm: () => deleteSection.mutate(section.id),
    });

  const confirmDeleteQuestion = (questionId: string) => {
    const question = sections
      .flatMap((section) => section.questions)
      .find((candidate) => candidate.id === questionId);
    if (!question) return;

    showConfirm({
      title: "Delete question",
      description: `"${question.label}" will be removed from this firm's questionnaire. This cannot be undone.`,
      confirmLabel: "Delete question",
      cancelLabel: "Cancel",
      onConfirm: () => deleteQuestion.mutate(questionId),
    });
  };

  const saveQuestion = async (values: QuestionDialogSubmit) => {
    if (questionTarget && questionTarget !== "new") {
      await updateQuestion.mutateAsync({
        questionId: questionTarget.id,
        data: {
          label: values.label,
          description: values.description,
          fieldKey: values.fieldKey,
          type: values.type,
          isRequired: values.isRequired,
          config: values.config,
        },
      });
      return;
    }

    await addQuestion.mutateAsync({
      sectionId: values.sectionId,
      label: values.label,
      description: values.description,
      fieldKey: values.fieldKey,
      type: values.type,
      isRequired: values.isRequired,
      config: values.config,
    });
  };

  if (!canRead) {
    return (
      <Box pt="24px" maxW="760px">
        <SurfaceCard>
          <Flex
            direction="column"
            align="center"
            gap="8px"
            py="24px"
            textAlign="center"
          >
            <Box color="fg.muted">
              <ShieldAlert size={28} />
            </Box>
            <Text fontWeight="600" color="fg">
              Case questionnaires are restricted
            </Text>
            <Text fontSize="13px" color="fg.muted">
              You need workflow access to view how the firm's questionnaires are
              set up.
            </Text>
          </Flex>
        </SurfaceCard>
      </Box>
    );
  }

  const firmQuestionCount = sections
    .flatMap((s) => s.questions)
    .filter((q) => q.scope === "firm").length;

  return (
    <Box pt="24px" maxW="1080px">
      <Text fontSize="20px" fontWeight="600" color="fg">
        Case questionnaires
      </Text>
      <Text
        fontSize="13px"
        color="fg.muted"
        mt="4px"
        maxW="620px"
        lineHeight="19px"
      >
        What the firm asks on every matter of a given type. The questions
        Oravanti provides are the same for every firm; add your own beside
        them, and those are yours to edit and remove.
      </Text>

      <Flex gap="12px" mt="20px" mb="16px" align="flex-end" flexWrap="wrap">
        <Box minW="300px" flex={1}>
          <Text fontSize="12px" color="fg.muted" mb="6px">
            Case type
          </Text>
          <SearchableSelect
            value={activeCaseTypeId}
            onChange={setCaseTypeId}
            options={caseTypeOptions}
            loading={practiceAreas.isLoading}
            placeholder="Choose a case type"
            searchPlaceholder="Search case types…"
            emptyText="No case type matches that"
            ariaLabel="Case type"
          />
        </Box>

        <SegmentGroup.Root
          value={stage}
          onValueChange={(e) =>
            setStage((e.value as QuestionnaireStage) ?? "case")
          }
          size="sm"
        >
          <SegmentGroup.Indicator />
          <SegmentGroup.Items
            items={[
              { label: "Case", value: "case" },
              { label: "Intake", value: "intake" },
            ]}
          />
        </SegmentGroup.Root>
      </Flex>

      {questionnaire.isLoading ? (
        <Stack gap="12px">
          <Skeleton height="72px" borderRadius="10px" />
          <Skeleton height="72px" borderRadius="10px" />
        </Stack>
      ) : !questionnaire.data?.systemQuestionnaire ? (
        <SurfaceCard>
          <Text fontSize="13px" color="fg.muted">
            No {stage} questionnaire has been published for this case type yet,
            so there is nothing to add to.
          </Text>
        </SurfaceCard>
      ) : (
        <>
          <Flex justify="space-between" align="center" mb="12px" gap="12px">
            <Text fontSize="12px" color="fg.muted">
              {firmQuestionCount === 0
                ? "The firm has added nothing to this questionnaire yet"
                : `${firmQuestionCount} firm question${firmQuestionCount === 1 ? "" : "s"} across ${sections.length} sections`}
            </Text>
            {canEdit && (
              <HStack gap="8px">
                <Button
                  variant="outline"
                  borderColor="border"
                  size="xs"
                  h="30px"
                  fontSize="12px"
                  fontWeight="400"
                  color="fg.muted"
                  gap="4px"
                  onClick={() => setSectionTarget("new")}
                >
                  <Plus size={13} />
                  Add section
                </Button>
                <Button
                  layerStyle="brand-button"
                  size="xs"
                  h="30px"
                  fontSize="12px"
                  fontWeight="400"
                  gap="4px"
                  onClick={() => setQuestionTarget("new")}
                >
                  <Plus size={13} />
                  Add question
                </Button>
              </HStack>
            )}
          </Flex>

          {/*
            Said once, at the top, rather than as a tooltip on every row that
            has no Edit. Somebody looking for the button needs to know it is
            absent by design before they go looking for it.
          */}
          {sections.some((section) => section.isLocked) && (
            <Text fontSize="12px" color="fg.muted" mb="12px" lineHeight="17px">
              Sections and questions marked <b>Oravanti</b> are provided with the
              platform and are the same for every firm. Add your own below —
              those are yours to edit and remove.
            </Text>
          )}

          {/*
            One section at a time, behind the same rail the matter's own
            Questionnaire tab uses.

            A questionnaire is its sections, and this one is 204 questions
            across fifteen of them: stacked on a single page, finding the one
            the firm wanted to add to meant scrolling past every question
            Oravanti asks. The rail is the questionnaire's contents — which is
            also the answer to "what is already asked?", the question this page
            exists to let somebody check before they add a duplicate.
          */}
          <Flex
            gap="20px"
            align="flex-start"
            direction={{ base: "column", lg: "row" }}
          >
            <SectionRail
              items={railSections}
              activeId={openSection?.id ?? null}
              onSelect={setOpenSectionId}
            />

            <Box flex={1} minW={0} w="full">
              {openSection && (
                <SectionCard
                  section={openSection}
                  canEdit={canEdit}
                  // A standard section is Oravanti's: neither editable nor
                  // removable here, so both controls are absent rather than
                  // present and refused by the server.
                  onEditSection={
                    openSection.isLocked
                      ? undefined
                      : () => setSectionTarget(openSection)
                  }
                  onDeleteSection={
                    openSection.isLocked
                      ? undefined
                      : () => confirmDeleteSection(openSection)
                  }
                  onEditQuestion={setQuestionTarget}
                  onDeleteQuestion={confirmDeleteQuestion}
                />
              )}
            </Box>
          </Flex>

          <QuestionDialog
            tier="firm"
            sections={sections}
            question={questionTarget === "new" ? null : questionTarget}
            open={questionTarget !== null}
            onOpenChange={(next) => !next && setQuestionTarget(null)}
            isPending={addQuestion.isPending || updateQuestion.isPending}
            onSubmit={saveQuestion}
          />
          <SectionDialog
            section={sectionTarget === "new" ? null : sectionTarget}
            open={sectionTarget !== null}
            onOpenChange={(next) => !next && setSectionTarget(null)}
            isPending={addSection.isPending || updateSection.isPending}
            scopeNote={
              sectionTarget === "new"
                ? "Added to every matter of this case type, including ones already open."
                : undefined
            }
            onSubmit={(values) =>
              sectionTarget === "new"
                ? addSection.mutateAsync(values)
                : updateSection.mutateAsync({
                    sectionId: (sectionTarget as CaseSection).id,
                    data: values,
                  })
            }
          />
        </>
      )}
    </Box>
  );
}

/**
 * One section and its questions.
 *
 * Standard questions are listed rather than hidden: a firm admin deciding what
 * to add needs to see what is already asked, or the same question gets asked
 * twice in slightly different words. They are listed *without* Edit and Remove,
 * because a firm extends Oravanti's questionnaire rather than rewording it —
 * and a control that only 404s is worse than no control at all.
 */
function SectionCard({
  section,
  canEdit,
  onEditSection,
  onDeleteSection,
  onEditQuestion,
  onDeleteQuestion,
}: {
  section: CaseSection;
  canEdit: boolean;
  onEditSection?: () => void;
  onDeleteSection?: () => void;
  onEditQuestion: (question: CaseQuestion) => void;
  onDeleteQuestion: (questionId: string) => void;
}) {
  return (
    <SurfaceCard>
      <Flex justify="space-between" align="flex-start" gap="12px">
        <Box minW={0}>
          <HStack gap="8px" align="baseline" flexWrap="wrap">
            <Text fontSize="14px" fontWeight="600" color="fg">
              {section.title}
            </Text>
            {section.isLocked && (
              <Badge size="sm" variant="subtle" colorPalette="gray" fontSize="10px">
                Oravanti
              </Badge>
            )}
          </HStack>
          {section.description && (
            <Text fontSize="12px" color="fg.muted" mt="2px" lineHeight="17px">
              {section.description}
            </Text>
          )}
        </Box>

        {canEdit && (
          <HStack gap="2px" flexShrink={0}>
            {onEditSection && (
              <IconButton
                aria-label={`Edit ${section.title}`}
                size="xs"
                variant="ghost"
                color="fg.muted"
                _hover={{ color: "fg" }}
                onClick={onEditSection}
              >
                <Pencil size={13} />
              </IconButton>
            )}
            {onDeleteSection && (
              <IconButton
                aria-label={`Remove ${section.title}`}
                size="xs"
                variant="ghost"
                color="fg.muted"
                _hover={{ color: "fg.error" }}
                onClick={onDeleteSection}
              >
                <Trash2 size={13} />
              </IconButton>
            )}
          </HStack>
        )}
      </Flex>

      <Stack gap="0" mt="12px">
        {section.questions.map((question) => (
          <Flex
            key={question.id}
            justify="space-between"
            align="center"
            gap="12px"
            py="8px"
            borderTop="1px solid"
            borderColor="border"
          >
            <HStack gap="8px" align="baseline" minW={0} flexWrap="wrap">
              <Text fontSize="13px" color="fg" lineHeight="17px">
                {question.label}
              </Text>
              <Badge
                size="sm"
                variant="outline"
                colorPalette="gray"
                fontSize="10px"
              >
                {questionTypeLabel(question.type)}
              </Badge>
              <Badge
                size="sm"
                variant="subtle"
                colorPalette={question.isLocked ? "gray" : "purple"}
                fontSize="10px"
              >
                {question.isLocked ? "Oravanti" : "firm"}
              </Badge>
              {question.isRequired && (
                <Text fontSize="11px" color="fg.error" lineHeight="1">
                  required
                </Text>
              )}
              {question.fieldKey && (
                <Text fontSize="11px" color="fg.subtle" fontFamily="mono">
                  {question.fieldKey}
                </Text>
              )}
            </HStack>

            {canEdit && (
              <HStack gap="2px" flexShrink={0}>
                {/* Both controls, or neither. A standard question is
                    Oravanti's — it is what every firm's clients are asked, and
                    what the form fields are wired to. */}
                {!question.isLocked && (
                  <>
                    <IconButton
                      aria-label={`Edit ${question.label}`}
                      size="xs"
                      variant="ghost"
                      color="fg.muted"
                      _hover={{ color: "fg" }}
                      onClick={() => onEditQuestion(question)}
                    >
                      <Pencil size={13} />
                    </IconButton>
                    <IconButton
                      aria-label={`Remove ${question.label}`}
                      size="xs"
                      variant="ghost"
                      color="fg.muted"
                      _hover={{ color: "fg.error" }}
                      onClick={() => onDeleteQuestion(question.id)}
                    >
                      <Trash2 size={13} />
                    </IconButton>
                  </>
                )}
              </HStack>
            )}
          </Flex>
        ))}

        {section.questions.length === 0 && (
          <Text fontSize="12px" color="fg.muted" py="8px">
            No questions in this section.
          </Text>
        )}
      </Stack>
    </SurfaceCard>
  );
}
