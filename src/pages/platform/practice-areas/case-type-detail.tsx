import {
  Badge,
  Box,
  Button,
  Card,
  Flex,
  HStack,
  IconButton,
  Spinner,
  Tabs,
  Text,
  VStack,
} from "@chakra-ui/react";
import { ArrowDown, ArrowUp, FileText, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";

import type {
  CaseTypeDetail,
  CaseTypeJurisdiction,
  CaseTypeQuestionnaireRef,
} from "@/api/platform";
import { SelectField, TextField } from "@/components/ui/bound-fields";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  useCaseType,
  useDeleteCaseType,
  useRemoveCaseTypeForm,
  useReorderCaseTypeForms,
  useUpdateCaseType,
} from "@/hooks/use-platform";
import { AddPackageFormDialog } from "./add-package-form-dialog";
import { NodeActions, NodeDialog, NodeHeading } from "./node";
import { nodePatch, type NodeValues } from "./node-values";

/**
 * One case type: what it files, and what it asks.
 *
 * ─── The two halves are not the same kind of thing ──────────────────────────
 *
 * The filing package is a list of government blanks, and the whole list lives
 * on this page — six rows, editable in place. A questionnaire is a document
 * with sections and questions, so this page holds a *reference* to it and the
 * editing happens on the questionnaire's own page.
 *
 * ─── What changing the package does, and does not do ────────────────────────
 *
 * These rows are what `defaultPackageFor` reads when a matter is set up. So a
 * change here decides what every firm's *next* matter of this type starts
 * with, and touches no matter that already exists — `ensurePackageForms` is
 * additive. The page says so, because "did I just add an I-864 to four hundred
 * open cases?" is the first thing anybody wonders.
 */
export function PlatformCaseTypeDetailPage() {
  const { caseTypeId } = useParams<{ caseTypeId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useCaseType(caseTypeId);

  const update = useUpdateCaseType(caseTypeId ?? "");
  const remove = useDeleteCaseType();

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useDocumentTitle(`${data?.caseType.name ?? "Case type"} · Oravanti`);

  if (isLoading || !data) {
    return (
      <HStack gap={2} py={6}>
        <Spinner size="sm" />
        <Text fontSize="13px" color="fg.muted">
          Loading…
        </Text>
      </HStack>
    );
  }

  const { caseType, forms, questionnaires } = data;

  return (
    <Box maxW="900px">
      <NodeHeading
        trail={[
          { label: "Practice areas", to: "/platform/practice-areas" },
          {
            label: caseType.practiceAreaName,
            to: `/platform/practice-areas/${caseType.practiceAreaId}`,
          },
          {
            label: caseType.subcategoryName,
            to: `/platform/subcategories/${caseType.subcategoryId}`,
          },
        ]}
        title={caseType.name}
        status={caseType.status}
        description={caseType.description}
        meta={
          <>
            <Text fontSize="12px" fontFamily="mono" color="fg.muted">
              {caseType.code}
            </Text>
            <Badge size="sm" variant="subtle" colorPalette="gray">
              {caseType.caseNumberPrefix}
            </Badge>
            {caseType.jurisdiction && (
              <Badge size="sm" variant="subtle" colorPalette="gray">
                {caseType.jurisdiction}
              </Badge>
            )}
          </>
        }
        actions={
          <NodeActions
            what="case type"
            name={caseType.name}
            status={caseType.status}
            onEdit={() => setIsEditing(true)}
            onSetStatus={(status) => update.mutate({ status })}
            onDelete={async () => {
              await remove.mutateAsync(caseType.id);
              navigate(`/platform/subcategories/${caseType.subcategoryId}`);
            }}
            isBusy={update.isPending || remove.isPending}
          />
        }
      />

      <FilingPackage
        caseTypeId={caseType.id}
        forms={forms}
        onAdd={() => setIsAdding(true)}
      />

      <Questionnaires
        caseTypeId={caseType.id}
        questionnaires={questionnaires}
      />

      <AddPackageFormDialog
        caseTypeId={caseType.id}
        open={isAdding}
        onOpenChange={setIsAdding}
      />

      <EditCaseTypeDialog
        caseType={caseType}
        open={isEditing}
        onOpenChange={setIsEditing}
      />
    </Box>
  );
}

type CaseTypeValues = NodeValues & {
  caseNumberPrefix: string;
  jurisdiction: CaseTypeJurisdiction;
};

/** Stable, because `SelectField` memoizes its collection. */
const JURISDICTIONS = [
  { value: "federal", label: "Federal" },
  { value: "state", label: "State" },
  { value: "federal & state", label: "Federal & state" },
  { value: "varies", label: "Varies" },
];

/**
 * Everything about a case type except its `code`.
 *
 * The code is half of a unique key and the seeds find this row by it, so it is
 * settable at creation and never after — see the API. `caseNumberPrefix` is
 * editable but retroactively meaningless: it is stamped into matter numbers as
 * they are issued, so a change here names the next matter and renames nothing.
 */
function EditCaseTypeDialog({
  caseType,
  open,
  onOpenChange,
}: {
  caseType: CaseTypeDetail["caseType"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateCaseType(caseType.id);

  const seed = (): CaseTypeValues => ({
    name: caseType.name,
    description: caseType.description ?? "",
    caseNumberPrefix: caseType.caseNumberPrefix,
    jurisdiction: caseType.jurisdiction ?? "federal",
  });

  const { control, getValues, reset } = useForm<CaseTypeValues>({
    defaultValues: seed(),
    mode: "onChange",
  });

  /* Re-seeded on open, not on every fetch — a background refetch must not
     discard what somebody has typed. */
  useEffect(() => {
    if (open) reset(seed());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, caseType, reset]);

  const save = async () => {
    const draft = getValues();
    await update.mutateAsync({
      ...nodePatch(draft),
      caseNumberPrefix: draft.caseNumberPrefix.trim(),
      jurisdiction: draft.jurisdiction,
    });
    onOpenChange(false);
  };

  const extraFields = useMemo(
    () => (
      <>
        <TextField
          control={control}
          name="caseNumberPrefix"
          label="Case number prefix"
          mono
          transform={(value) => value.toUpperCase()}
          rules={{
            required: "A prefix is needed.",
            pattern: {
              value: /^[A-Z0-9-]+$/,
              message: "Uppercase letters, numbers and hyphens.",
            },
          }}
          hint="Applies to matters opened from now on. Numbers already issued keep the prefix they were given."
        />
        <SelectField
          control={control}
          name="jurisdiction"
          label="Jurisdiction"
          options={JURISDICTIONS}
        />
      </>
    ),
    [control],
  );

  return (
    <NodeDialog
      title="Edit case type"
      submitLabel="Save"
      control={control}
      extraFields={extraFields}
      onSubmit={save}
      isPending={update.isPending}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

function FilingPackage({
  caseTypeId,
  forms,
  onAdd,
}: {
  caseTypeId: string;
  forms: {
    formCode: string;
    role: "core" | "supporting";
    title: string | null;
  }[];
  onAdd: () => void;
}) {
  const remove = useRemoveCaseTypeForm(caseTypeId);
  const reorder = useReorderCaseTypeForms(caseTypeId);
  const { showConfirm } = useConfirmDialog();

  /**
   * Moves one form and sends the whole list.
   *
   * The API takes the complete package rather than a from/to pair, because a
   * partial reorder has to decide what happens to the codes it did not mention
   * and every answer to that is a rule somebody has to remember.
   */
  const move = (index: number, direction: -1 | 1) => {
    const next = [...forms.map((form) => form.formCode)];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next);
  };

  return (
    <Card.Root size="sm" borderColor="border" mb={5}>
      <Card.Body>
        <Flex justify="space-between" align="flex-start" gap={3} mb={3}>
          <Box minW={0}>
            <Text fontSize="13px" fontWeight="600" color="fg">
              Filing package
            </Text>
            <Text fontSize="12px" color="fg.muted" mt={0.5} lineHeight="17px">
              What a new matter of this type starts with. Matters already open
              keep the forms they have.
            </Text>
          </Box>
          <Button size="xs" variant="outline" flexShrink={0} onClick={onAdd}>
            <Plus size={13} />
            Add form
          </Button>
        </Flex>

        {forms.length === 0 ? (
          <Text fontSize="13px" color="fg.muted" py={3}>
            No forms yet — a matter of this type opens with none.
          </Text>
        ) : (
          <VStack align="stretch" gap={0}>
            {forms.map((form, index) => (
              <HStack
                key={form.formCode}
                gap={2.5}
                py={2}
                borderBottom={
                  index < forms.length - 1 ? "1px solid" : undefined
                }
                borderColor="border.subtle"
              >
                {/*
                  The row is the way into the form. A form is reached through
                  the case type that files it — there is no practice-area folder
                  of forms to browse, because the I-864 would have to be in
                  several at once — so this link is the navigation the tier is
                  built on rather than a convenience.
                */}
                <Link to={`/platform/forms/${form.formCode}`}>
                  <Text
                    fontSize="12px"
                    fontFamily="mono"
                    fontWeight="600"
                    minW="52px"
                    flexShrink={0}
                    _hover={{ textDecoration: "underline" }}
                  >
                    {form.formCode}
                  </Text>
                </Link>

                {/*
                  A package may name a form nobody has catalogued yet. The row
                  is real and will go on a matter, so saying so beats hiding it
                  — and cataloguing it is the fix the link above leads to.
                */}
                {form.title ? (
                  <Text fontSize="13px" color="fg" truncate>
                    {form.title}
                  </Text>
                ) : (
                  <Text fontSize="12px" color="fg.error" truncate>
                    Not in the catalogue — it will print blank
                  </Text>
                )}

                <Badge
                  size="sm"
                  variant="subtle"
                  colorPalette={form.role === "core" ? "blue" : "gray"}
                  ml="auto"
                  flexShrink={0}
                >
                  {form.role}
                </Badge>

                <HStack gap={0.5} flexShrink={0}>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    aria-label={`Move ${form.formCode} earlier`}
                    disabled={index === 0 || reorder.isPending}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={13} />
                  </IconButton>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    aria-label={`Move ${form.formCode} later`}
                    disabled={index === forms.length - 1 || reorder.isPending}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={13} />
                  </IconButton>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    colorPalette="red"
                    aria-label={`Take ${form.formCode} off this package`}
                    onClick={() =>
                      showConfirm({
                        title: `Take ${form.formCode} off this package?`,
                        description:
                          "New matters of this type will not include it. Matters already open keep it, and nothing already filed is affected.",
                        confirmLabel: "Remove",
                        cancelLabel: "Cancel",
                        onConfirm: () => remove.mutate(form.formCode),
                      })
                    }
                  >
                    <Trash2 size={13} />
                  </IconButton>
                </HStack>
              </HStack>
            ))}
          </VStack>
        )}
      </Card.Body>
    </Card.Root>
  );
}

/**
 * The two questionnaires a case type can have, as two tabs.
 *
 * Tabs rather than a list because they are not interchangeable and there is
 * exactly one of each: `intake` is asked before there is a matter — it is what
 * a lead answers — and `case` is asked while the matter runs. The database
 * says so too, with a unique constraint on (case type, stage), which is why an
 * empty tab offers to create rather than to add another.
 */
function Questionnaires({
  caseTypeId,
  questionnaires,
}: {
  caseTypeId: string;
  questionnaires: {
    intake: CaseTypeQuestionnaireRef | null;
    case: CaseTypeQuestionnaireRef | null;
  };
}) {
  return (
    <Card.Root size="sm" borderColor="border">
      <Card.Body>
        <Text fontSize="13px" fontWeight="600" color="fg" mb={0.5}>
          Questionnaires
        </Text>
        <Text fontSize="12px" color="fg.muted" mb={3} lineHeight="17px">
          What every firm's clients are asked. Firms add their own questions
          beside these and cannot change them.
        </Text>

        <Tabs.Root defaultValue="intake" size="sm" variant="line">
          <Tabs.List>
            <Tabs.Trigger value="intake" fontSize="12px">
              Intake
            </Tabs.Trigger>
            <Tabs.Trigger value="case" fontSize="12px">
              Case
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="intake" pt={3}>
            <StageTab
              caseTypeId={caseTypeId}
              stage="intake"
              questionnaire={questionnaires.intake}
              blurb="Asked before the matter opens — this is what a lead fills in."
            />
          </Tabs.Content>

          <Tabs.Content value="case" pt={3}>
            <StageTab
              caseTypeId={caseTypeId}
              stage="case"
              questionnaire={questionnaires.case}
              blurb="Asked while the matter runs, and what fills the forms above."
            />
          </Tabs.Content>
        </Tabs.Root>
      </Card.Body>
    </Card.Root>
  );
}

function StageTab({
  caseTypeId,
  stage,
  questionnaire,
  blurb,
}: {
  caseTypeId: string;
  stage: "intake" | "case";
  questionnaire: CaseTypeQuestionnaireRef | null;
  blurb: string;
}) {
  if (!questionnaire) {
    return (
      <VStack align="stretch" gap={2.5} py={2}>
        <Text fontSize="12px" color="fg.muted" lineHeight="17px">
          {blurb}
        </Text>
        <Text fontSize="13px" color="fg.muted">
          No {stage} questionnaire for this case type yet.
        </Text>
        <Box>
          <Button size="xs" layerStyle="brand-button" asChild>
            {/*
              Carries the case type and stage into the create form, so the two
              fields that decide which questionnaire this is are answered by
              where you came from rather than by picking a case type out of
              687.
            */}
            <Link
              to={`/platform/questionnaires?caseTypeId=${caseTypeId}&stage=${stage}`}
            >
              <Plus size={13} />
              Create {stage} questionnaire
            </Link>
          </Button>
        </Box>
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap={2} py={1}>
      <Text fontSize="12px" color="fg.muted" lineHeight="17px">
        {blurb}
      </Text>
      <Link to={`/platform/questionnaires/${questionnaire.id}`}>
        <HStack
          gap={2.5}
          px={2.5}
          py={2}
          borderRadius="md"
          border="1px solid"
          borderColor="border"
          _hover={{ borderColor: "border.emphasized" }}
          transition="border-color 120ms"
        >
          <FileText size={14} color="var(--chakra-colors-fg-muted)" />
          <Box minW={0}>
            <Text fontSize="13px" fontWeight="500" color="fg" truncate>
              {questionnaire.title}
            </Text>
            {questionnaire.description && (
              <Text fontSize="12px" color="fg.muted" truncate>
                {questionnaire.description}
              </Text>
            )}
          </Box>
        </HStack>
      </Link>
    </VStack>
  );
}
