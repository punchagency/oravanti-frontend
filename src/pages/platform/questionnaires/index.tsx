import {
  Badge,
  Box,
  Button,
  Card,
  Dialog,
  HStack,
  Portal,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";

import type { QuestionnaireStage } from "@/api/platform";
import { PlatformPageHeader } from "../page-header";
import {
  SubmitWhenValid,
  TextAreaField,
  TextField,
} from "@/components/ui/bound-fields";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  useCaseType,
  useCreateSystemQuestionnaire,
  useSystemQuestionnaires,
} from "@/hooks/use-platform";
import { ListState, PagedFooter, SearchBox } from "../paged";
import { usePagedList } from "../use-paged-list";

/**
 * The default questionnaires, by case type.
 *
 * Every firm on the platform starts from these and may add to them — the
 * governing rule from the other direction: a questionnaire *is* a conversation
 * with a client, so a firm has a legitimate reason to ask more than we thought
 * to. What it cannot do is edit or remove what we ask, which is why a firm's
 * own settings screen shows these as fixed and this one shows them as editable.
 *
 * ─── This is a flat index, not the way in ───────────────────────────────────
 *
 * A questionnaire belongs to a case type, so the place to create one is that
 * case type's page — Practice areas → … → the leaf, where the Intake and Case
 * tabs each offer to create the one that is missing. Arriving that way answers
 * the two fields that decide which questionnaire this is, which is why the
 * dialog below has neither: picking a case type out of 687 in a dropdown was
 * the alternative.
 *
 * This page stays because "show me every questionnaire we ship" is a real
 * question, and answering it by walking the tree would be absurd.
 */
export function PlatformQuestionnairesPage() {
  useDocumentTitle("Questionnaires · Oravanti");

  const [params, setParams] = useSearchParams();
  const caseTypeId = params.get("caseTypeId");
  const stage = (params.get("stage") ?? "intake") as QuestionnaireStage;

  const list = usePagedList(12);
  const { data, isLoading } = useSystemQuestionnaires(list.params);

  /*
    The URL is the open/closed state, not a `useState` synchronised to it.

    The case type page sends an operator here with both fields already decided,
    so the dialog should be in front of them on arrival rather than behind one
    more click — and closing it should take the two params off the URL, so that
    a reload, a bookmark or the Back button all agree with what is on screen.
  */
  const closeDialog = () => {
    const next = new URLSearchParams(params);
    next.delete("caseTypeId");
    next.delete("stage");
    setParams(next, { replace: true });
  };

  const questionnaires = data?.data ?? [];

  return (
    <Box maxW="1100px">
      <PlatformPageHeader
        title="Questionnaires"
        description="What every firm's clients are asked. Firms add their own questions beside these; they cannot change or remove them."
        actions={
          <Button size="sm" layerStyle="brand-button" asChild>
            <Link to="/platform/practice-areas">
              <Plus size={14} />
              New questionnaire
            </Link>
          </Button>
        }
        toolbar={<SearchBox list={list} placeholder="Find a questionnaire…" />}
      />

      <ListState
        isLoading={isLoading && questionnaires.length === 0}
        isEmpty={!isLoading && questionnaires.length === 0}
        empty={
          list.search
            ? `No questionnaire matches “${list.search}”.`
            : "No questionnaires yet. Start from a case type under Practice areas."
        }
      />

      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={3}>
        {questionnaires.map((questionnaire) => (
          <Card.Root
            key={questionnaire.id}
            size="sm"
            borderColor="border"
            _hover={{ borderColor: "border.emphasized" }}
            transition="border-color 120ms"
          >
            <Card.Body>
              <Link to={`/platform/questionnaires/${questionnaire.id}`}>
                <HStack gap={2} mb={1.5}>
                  <Badge
                    size="sm"
                    variant="subtle"
                    colorPalette={
                      questionnaire.stage === "intake" ? "blue" : "purple"
                    }
                  >
                    {questionnaire.stage}
                  </Badge>
                  <Text fontSize="12px" color="fg.muted" truncate>
                    {questionnaire.caseTypeName}
                  </Text>
                </HStack>
                <Text fontSize="13px" fontWeight="500" color="fg">
                  {questionnaire.title}
                </Text>
                {questionnaire.description && (
                  <Text
                    fontSize="12px"
                    color="fg.muted"
                    mt={1}
                    lineHeight="17px"
                    lineClamp={2}
                  >
                    {questionnaire.description}
                  </Text>
                )}
              </Link>
            </Card.Body>
          </Card.Root>
        ))}
      </SimpleGrid>

      <PagedFooter list={list} total={data?.pagination.total ?? 0} />

      {caseTypeId && (
        <NewQuestionnaireDialog
          caseTypeId={caseTypeId}
          stage={stage}
          open
          onClose={closeDialog}
        />
      )}
    </Box>
  );
}

type Values = { title: string; description: string };

/**
 * Start a case type's questionnaire.
 *
 * The case type and the stage arrive in the URL from the page that sent you,
 * so this asks only what is left: what it is called. Sections and questions
 * come afterwards, on the detail page — making somebody compose a whole
 * questionnaire before saving any of it is how a draft gets lost.
 */
function NewQuestionnaireDialog({
  caseTypeId,
  stage,
  open,
  onClose,
}: {
  caseTypeId: string;
  stage: QuestionnaireStage;
  open: boolean;
  onClose: () => void;
}) {
  const { data: caseType } = useCaseType(caseTypeId);
  const create = useCreateSystemQuestionnaire();

  const { control, getValues, reset } = useForm<Values>({
    defaultValues: { title: "", description: "" },
    mode: "onChange",
  });

  const save = async () => {
    const draft = getValues();
    await create.mutateAsync({
      caseTypeId,
      stage,
      title: draft.title.trim(),
      description: draft.description.trim() || null,
    });
    reset();
    onClose();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) onClose();
      }}
      size="sm"
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="460px"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            bg="bg"
          >
            <Dialog.Header>
              <Dialog.Title fontSize="14px" fontWeight="600">
                New {stage} questionnaire
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3.5} align="stretch">
                <Box
                  px={3}
                  py={2.5}
                  borderRadius="md"
                  bg="bg.muted"
                  border="1px solid"
                  borderColor="border.subtle"
                >
                  <Text fontSize="11px" color="fg.subtle" mb={0.5}>
                    Case type
                  </Text>
                  <Text fontSize="13px" fontWeight="500" color="fg">
                    {caseType?.caseType.name ?? "…"}
                  </Text>
                </Box>

                <Text fontSize="12px" color="fg.muted" lineHeight="17px">
                  Every firm handling this case type will use it. There is one
                  questionnaire per case type per stage, so this replaces
                  nothing — it fills the gap the {stage} tab was showing.
                </Text>

                <TextField
                  control={control}
                  name="title"
                  label="Title"
                  placeholder="Adjustment of status intake"
                  rules={{ required: "A title is needed." }}
                />

                <TextAreaField
                  control={control}
                  name="description"
                  label="Description (optional)"
                  placeholder="What this questionnaire is for, in a sentence."
                />
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button size="sm" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <SubmitWhenValid
                control={control}
                onClick={save}
                isPending={create.isPending}
              >
                Create
              </SubmitWhenValid>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
