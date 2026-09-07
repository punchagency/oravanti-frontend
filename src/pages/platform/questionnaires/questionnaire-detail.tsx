import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  HStack,
  IconButton,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";

import type { SystemQuestion, SystemSection } from "@/api/platform";
import type { QuestionType } from "@/api/questionnaires";
import {
  QuestionDialog,
  type QuestionDialogSubmit,
} from "@/components/questionnaire/question-dialog";
import { SectionDialog } from "@/components/questionnaire/section-dialog";
import { SectionRail } from "@/components/questionnaire/section-rail";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  useAddSystemQuestion,
  useAddSystemSection,
  useDeleteSystemQuestion,
  useDeleteSystemSection,
  useCaseType,
  useSystemQuestionnaire,
  useUpdateSystemQuestion,
  useUpdateSystemQuestionnaire,
  useUpdateSystemSection,
} from "@/hooks/use-platform";
import { questionTypeLabel } from "@/utils/question-types";
import { PlatformPageHeader } from "../page-header";

/**
 * One default questionnaire, in full.
 *
 * The same shape as every other view of a questionnaire — a rail of its
 * sections, one section's questions at a time, a dialog for each — and
 * deliberately so: it is the same object at a different tier, and somebody who
 * maintains both should not have to learn it twice. The rail and the dialogs
 * are literally the same components the firm's screens use.
 *
 * What differs is the reach, and every destructive control here says so before
 * it acts. Removing a question from a firm's questionnaire affects that firm's
 * open matters; removing one from here affects every firm's, and takes the
 * answers already given with it.
 */
export function PlatformQuestionnaireDetailPage() {
  const { questionnaireId = "" } = useParams();
  const { showConfirm } = useConfirmDialog();

  const { data: questionnaire, isLoading } =
    useSystemQuestionnaire(questionnaireId);
  /*
    One fetch for the leaf this questionnaire belongs to, rather than the whole
    687-row taxonomy to look up a single name — which is what this did before
    the list was paginated.
  */
  const { data: caseTypeDetail } = useCaseType(questionnaire?.caseTypeId);

  useDocumentTitle(
    questionnaire ? `${questionnaire.title} · Oravanti` : "Questionnaire",
  );

  const updateQuestionnaire = useUpdateSystemQuestionnaire(questionnaireId);
  const addSection = useAddSystemSection(questionnaireId);
  const updateSection = useUpdateSystemSection(questionnaireId);
  const deleteSection = useDeleteSystemSection(questionnaireId);
  const addQuestion = useAddSystemQuestion(questionnaireId);
  const updateQuestion = useUpdateSystemQuestion(questionnaireId);
  const deleteQuestion = useDeleteSystemQuestion(questionnaireId);

  /** `"new"` while adding; the row while editing; null while closed. */
  const [sectionTarget, setSectionTarget] = useState<
    SystemSection | "new" | null
  >(null);
  const [questionTarget, setQuestionTarget] = useState<{
    question: SystemQuestion | null;
    sectionId: string;
  } | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);

  const sections = useMemo(
    () => questionnaire?.sections ?? [],
    [questionnaire],
  );

  /*
    Which section is on screen.

    Null until somebody chooses, and the first section stands in — a
    questionnaire always has somewhere to be, and there is no empty state
    worth rendering for "you have not picked a section yet".
  */
  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const openSection =
    sections.find((section) => section.id === openSectionId) ?? sections[0];

  /*
    The rail's entries.

    A count of questions rather than a filled/total pair: nobody answers this
    copy of the questionnaire. It is the vocabulary itself, and how long a
    section is, is what an operator is choosing between.
  */
  const railSections = useMemo(
    () =>
      sections.map((section) => ({
        id: section.id,
        title: section.title,
        note: `${section.questions.length} question${section.questions.length === 1 ? "" : "s"}`,
      })),
    [sections],
  );

  const confirmDeleteSection = (section: SystemSection) =>
    showConfirm({
      title: "Remove section",
      description: `"${section.title}" and its ${section.questions.length} question${section.questions.length === 1 ? "" : "s"} are removed from every firm's questionnaire, along with the answers already given to them. This cannot be undone.`,
      confirmLabel: "Remove section",
      cancelLabel: "Cancel",
      onConfirm: () => deleteSection.mutate(section.id),
    });

  const confirmDeleteQuestion = (
    section: SystemSection,
    question: SystemQuestion,
  ) =>
    showConfirm({
      title: "Remove question",
      description: `"${question.label}" stops being asked of every firm's clients, and the answers already given to it are removed with it. This cannot be undone.`,
      confirmLabel: "Remove question",
      cancelLabel: "Cancel",
      onConfirm: () =>
        deleteQuestion.mutate({
          sectionId: section.id,
          questionId: question.id,
        }),
    });

  const saveQuestion = async (values: QuestionDialogSubmit) => {
    if (!questionTarget) return;

    const payload = {
      label: values.label,
      description: values.description,
      fieldKey: values.fieldKey ?? null,
      type: values.type,
      isRequired: values.isRequired,
      config: values.config,
    };

    if (questionTarget.question) {
      await updateQuestion.mutateAsync({
        // The dialog's section select can move a question, so the section it
        // is being saved *into* is the one from the form, not the one it was
        // opened from.
        sectionId: questionTarget.sectionId,
        questionId: questionTarget.question.id,
        patch: payload,
      });
    } else {
      await addQuestion.mutateAsync({
        sectionId: values.sectionId,
        input: payload,
      });
    }
    setQuestionTarget(null);
  };

  if (isLoading) {
    return (
      <HStack gap={2} py={6}>
        <Spinner size="sm" />
        <Text fontSize="13px" color="fg.muted">
          Loading…
        </Text>
      </HStack>
    );
  }

  if (!questionnaire) {
    return (
      <Box maxW="640px">
        <BackLink />
        <Text fontSize="14px" color="fg" mt={4}>
          No questionnaire with that id.
        </Text>
      </Box>
    );
  }

  const caseTypeName = caseTypeDetail?.caseType.name ?? "…";

  return (
    <Box maxW="1080px">
      <PlatformPageHeader
        trail={[{ label: "Questionnaires", to: "/platform/questionnaires" }]}
        title={questionnaire.title}
        description={questionnaire.description}
        actions={
          <>
            <IconButton
              size="xs"
              variant="ghost"
              aria-label="Edit questionnaire"
              onClick={() => setEditingTitle(true)}
            >
              <Pencil size={13} />
            </IconButton>
            <Button
              size="xs"
              layerStyle="brand-button"
              onClick={() => setSectionTarget("new")}
            >
              <Plus size={13} />
              Add section
            </Button>
          </>
        }
      >
        {/* Which conversation this is, and whose. Under the title rather than
            above it: the title is what somebody scanned the page for. */}
        <HStack gap={2} mt={2} flexWrap="wrap">
          <Badge
            size="sm"
            variant="subtle"
            colorPalette={questionnaire.stage === "intake" ? "blue" : "purple"}
          >
            {questionnaire.stage}
          </Badge>
          <Text fontSize="12px" color="fg.muted">
            {caseTypeName}
          </Text>
        </HStack>
      </PlatformPageHeader>

      {sections.length === 0 ? (
        <Text fontSize="13px" color="fg.muted" py={4}>
          No sections yet. Add one to start asking questions.
        </Text>
      ) : (
        /*
          One section at a time, behind the same rail a firm reads a matter's
          questionnaire through.

          A questionnaire *is* its sections — the adjustment one is 204
          questions across fifteen of them — and stacking every one of them on
          a single page lost that shape twice over: an operator looking for
          "Employment history" scrolled past nine other sections to find it,
          and the page mounted all 204 rows so they could. The rail is the
          questionnaire's contents; the panel is the section they picked.

          The same object seen from both tiers, deliberately. The firm reads
          this questionnaire section by section on the matter, so the tier that
          writes it should not be looking at a different thing.
        */
        <Flex
          gap={5}
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
              <SectionPanel
                section={openSection}
                onEditSection={() => setSectionTarget(openSection)}
                onRemoveSection={() => confirmDeleteSection(openSection)}
                onEditQuestion={(question) =>
                  setQuestionTarget({ question, sectionId: openSection.id })
                }
                onRemoveQuestion={(question) =>
                  confirmDeleteQuestion(openSection, question)
                }
                onAddQuestion={() =>
                  setQuestionTarget({
                    question: null,
                    sectionId: openSection.id,
                  })
                }
              />
            )}
          </Box>
        </Flex>
      )}
      <SectionDialog
        section={sectionTarget === "new" ? null : sectionTarget}
        open={sectionTarget !== null}
        onOpenChange={(open) => !open && setSectionTarget(null)}
        isPending={addSection.isPending || updateSection.isPending}
        scopeNote="Every firm on the platform sees this section, on every matter of this case type."
        onSubmit={async (values) => {
          if (sectionTarget && sectionTarget !== "new") {
            await updateSection.mutateAsync({
              sectionId: sectionTarget.id,
              patch: values,
            });
          } else {
            await addSection.mutateAsync(values);
          }
          setSectionTarget(null);
        }}
      />

      <QuestionDialog
        tier="platform"
        sections={sections}
        question={
          questionTarget?.question
            ? {
                ...questionTarget.question,
                type: questionTarget.question.type as QuestionType,
              }
            : null
        }
        defaultSectionId={questionTarget?.sectionId}
        open={questionTarget !== null}
        onOpenChange={(open) => !open && setQuestionTarget(null)}
        isPending={addQuestion.isPending || updateQuestion.isPending}
        onSubmit={saveQuestion}
      />

      <SectionDialog
        section={questionnaire}
        open={editingTitle}
        onOpenChange={setEditingTitle}
        isPending={updateQuestionnaire.isPending}
        scopeNote="The questionnaire's own name and description, as staff see them."
        onSubmit={async (values) => {
          await updateQuestionnaire.mutateAsync(values);
          setEditingTitle(false);
        }}
      />
    </Box>
  );
}

function BackLink() {
  const navigate = useNavigate();

  return (
    <Button
      size="xs"
      variant="ghost"
      pl={0}
      color="fg.muted"
      onClick={() => navigate("/platform/questionnaires")}
    >
      <ArrowLeft size={13} />
      All questionnaires
    </Button>
  );
}

/**
 * One section of the questionnaire, and every question in it.
 *
 * A component rather than a block inside the page because the page now renders
 * exactly one of these — what it takes is what a section needs to be edited,
 * and having that written down is the difference between reading the rail's
 * job and the panel's.
 */
function SectionPanel({
  section,
  onEditSection,
  onRemoveSection,
  onEditQuestion,
  onRemoveQuestion,
  onAddQuestion,
}: {
  section: SystemSection;
  onEditSection: () => void;
  onRemoveSection: () => void;
  onEditQuestion: (question: SystemQuestion) => void;
  onRemoveQuestion: (question: SystemQuestion) => void;
  onAddQuestion: () => void;
}) {
  return (
    <Card.Root size="sm" borderColor="border">
      <Card.Body>
        <Flex justify="space-between" align="flex-start" gap={3} mb={2}>
          <Box minW={0}>
            <Text fontSize="13px" fontWeight="600" color="fg">
              {section.title}
            </Text>
            {section.description && (
              <Text fontSize="12px" color="fg.muted" mt={0.5}>
                {section.description}
              </Text>
            )}
          </Box>
          <HStack gap={1} flexShrink={0}>
            <IconButton
              size="xs"
              variant="ghost"
              aria-label={`Edit ${section.title}`}
              onClick={onEditSection}
            >
              <Pencil size={13} />
            </IconButton>
            <IconButton
              size="xs"
              variant="ghost"
              colorPalette="red"
              aria-label={`Remove ${section.title}`}
              onClick={onRemoveSection}
            >
              <Trash2 size={13} />
            </IconButton>
          </HStack>
        </Flex>

        <Stack gap={0}>
          {section.questions.map((question) => (
            <Flex
              key={question.id}
              gap={3}
              py={2}
              align="center"
              borderTop="1px solid"
              borderColor="border"
            >
              <Box flex="1" minW={0}>
                <HStack gap={1.5} align="baseline" flexWrap="wrap">
                  <Text fontSize="13px" color="fg" lineHeight="17px">
                    {question.label}
                  </Text>
                  {question.isRequired && (
                    <Text fontSize="11px" color="fg.error" lineHeight="1">
                      required
                    </Text>
                  )}
                </HStack>
                <HStack gap={2} mt={0.5}>
                  <Badge
                    size="sm"
                    variant="subtle"
                    colorPalette="gray"
                    fontSize="10px"
                  >
                    {questionTypeLabel(question.type)}
                  </Badge>
                  {/*
                    The field key earns its place on the list rather than only
                    in the dialog: it is what connects this question to the
                    form box it fills, and a question that should have one and
                    does not is invisible otherwise.
                  */}
                  {question.fieldKey && (
                    <Text fontSize="11px" color="fg.subtle" fontFamily="mono">
                      {question.fieldKey}
                    </Text>
                  )}
                </HStack>
              </Box>

              <HStack gap={1} flexShrink={0}>
                <IconButton
                  size="xs"
                  variant="ghost"
                  aria-label={`Edit ${question.label}`}
                  onClick={() => onEditQuestion(question)}
                >
                  <Pencil size={13} />
                </IconButton>
                <IconButton
                  size="xs"
                  variant="ghost"
                  colorPalette="red"
                  aria-label={`Remove ${question.label}`}
                  onClick={() => onRemoveQuestion(question)}
                >
                  <Trash2 size={13} />
                </IconButton>
              </HStack>
            </Flex>
          ))}

          {section.questions.length === 0 && (
            <Text fontSize="12px" color="fg.muted" py={2}>
              No questions in this section yet.
            </Text>
          )}
        </Stack>

        <Button
          size="xs"
          variant="ghost"
          mt={2}
          color="fg.muted"
          onClick={onAddQuestion}
        >
          <Plus size={13} />
          Add question
        </Button>
      </Card.Body>
    </Card.Root>
  );
}
