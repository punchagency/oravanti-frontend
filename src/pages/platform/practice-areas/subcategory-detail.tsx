import {
  Badge,
  Box,
  Button,
  Card,
  HStack,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import { ChevronRight, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";

import type { CaseTypeJurisdiction } from "@/api/platform";
import { SelectField, TextField } from "@/components/ui/bound-fields";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  useCaseTypes,
  useCreateCaseType,
  useDeleteSubcategory,
  useSubcategory,
  useUpdateSubcategory,
} from "@/hooks/use-platform";
import { PlatformSectionHeader } from "../page-header";
import { NodeActions, NodeDialog, NodeHeading, StatusBadge } from "./node";
import { nodePatch, type NodeValues } from "./node-values";
import { ListState, PagedFooter, SearchBox } from "../paged";
import { usePagedList } from "../use-paged-list";

/**
 * One subcategory: what it groups, and the case types under it.
 *
 * The case type is where the taxonomy stops being abstract — it is the level
 * that files forms and asks a questionnaire — so each card here says whether
 * that work has been done. Of 687 leaves only a handful are configured, and a
 * list that did not distinguish them would be 687 identical rows.
 */
export function PlatformSubcategoryDetailPage() {
  const { subcategoryId } = useParams<{ subcategoryId: string }>();
  const navigate = useNavigate();

  const { data: subcategory } = useSubcategory(subcategoryId);
  const list = usePagedList(12);
  const { data, isLoading } = useCaseTypes(subcategoryId, list.params);

  const update = useUpdateSubcategory(subcategoryId ?? "");
  const remove = useDeleteSubcategory();

  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useDocumentTitle(`${subcategory?.name ?? "Subcategory"} · Oravanti`);

  const caseTypes = data?.data ?? [];

  return (
    <Box maxW="1100px">
      <NodeHeading
        trail={[
          { label: "Practice areas", to: "/platform/practice-areas" },
          ...(subcategory
            ? [
                {
                  label: subcategory.practiceAreaName,
                  to: `/platform/practice-areas/${subcategory.practiceAreaId}`,
                },
              ]
            : []),
        ]}
        title={subcategory?.name ?? "Subcategory"}
        status={subcategory?.status ?? "active"}
        description={subcategory?.description ?? null}
        meta={
          subcategory && (
            <>
              <Text fontSize="12px" fontFamily="mono" color="fg.muted">
                {subcategory.code}
              </Text>
              <Text fontSize="12px" color="fg.muted">
                {subcategory.caseTypeCount} case types
              </Text>
            </>
          )
        }
        actions={
          subcategory && (
            <NodeActions
              what="subcategory"
              name={subcategory.name}
              status={subcategory.status}
              onEdit={() => setIsEditing(true)}
              onSetStatus={(status) => update.mutate({ status })}
              onDelete={async () => {
                await remove.mutateAsync(subcategory.id);
                navigate(
                  `/platform/practice-areas/${subcategory.practiceAreaId}`,
                );
              }}
              isBusy={update.isPending || remove.isPending}
            />
          )
        }
      />

      <PlatformSectionHeader
        title="Case types"
        actions={
          <Button
            size="sm"
            layerStyle="brand-button"
            onClick={() => setIsAdding(true)}
          >
            <Plus size={14} />
            New case type
          </Button>
        }
        toolbar={<SearchBox list={list} placeholder="Find a case type…" />}
      />

      <ListState
        isLoading={isLoading && caseTypes.length === 0}
        isEmpty={!isLoading && caseTypes.length === 0}
        empty={
          list.search
            ? `No case type matches “${list.search}”.`
            : "This subcategory has no case types yet."
        }
      />

      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={3}>
        {caseTypes.map((caseType) => {
          const isSetUp =
            caseType.formCount > 0 || caseType.questionnaireCount > 0;

          return (
            <Card.Root
              key={caseType.id}
              size="sm"
              borderColor="border"
              _hover={{ borderColor: "border.emphasized" }}
              transition="border-color 120ms"
              opacity={caseType.status === "archived" ? 0.65 : 1}
            >
              <Card.Body>
                <Link to={`/platform/case-types/${caseType.id}`}>
                  <HStack justify="space-between" gap={2} mb={1.5}>
                    <HStack gap={2} minW={0}>
                      <Text
                        fontSize="13px"
                        fontWeight="500"
                        color="fg"
                        lineClamp={2}
                      >
                        {caseType.name}
                      </Text>
                      <StatusBadge status={caseType.status} />
                    </HStack>
                    <ChevronRight
                      size={14}
                      color="var(--chakra-colors-fg-subtle)"
                      style={{ flexShrink: 0 }}
                    />
                  </HStack>

                  {isSetUp ? (
                    <HStack gap={1.5}>
                      {caseType.formCount > 0 && (
                        <Badge size="sm" variant="subtle" colorPalette="blue">
                          {caseType.formCount} forms
                        </Badge>
                      )}
                      {caseType.questionnaireCount > 0 && (
                        <Badge size="sm" variant="subtle" colorPalette="purple">
                          {caseType.questionnaireCount} questionnaires
                        </Badge>
                      )}
                    </HStack>
                  ) : (
                    /*
                      Said plainly rather than left blank. A matter opened under
                      this case type today starts with no forms — that is a fact
                      about the product, not an empty cell.
                    */
                    <Text fontSize="11px" color="fg.subtle">
                      Nothing set up yet
                    </Text>
                  )}
                </Link>
              </Card.Body>
            </Card.Root>
          );
        })}
      </SimpleGrid>

      <PagedFooter list={list} total={data?.pagination.total ?? 0} />

      {subcategory && (
        <EditSubcategoryDialog
          subcategory={subcategory}
          open={isEditing}
          onOpenChange={setIsEditing}
        />
      )}
      {subcategoryId && (
        <NewCaseTypeDialog
          subcategoryId={subcategoryId}
          open={isAdding}
          onOpenChange={setIsAdding}
        />
      )}
    </Box>
  );
}

function EditSubcategoryDialog({
  subcategory,
  open,
  onOpenChange,
}: {
  subcategory: { id: string; name: string; description: string | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdateSubcategory(subcategory.id);
  const { control, getValues, reset } = useForm<NodeValues>({
    defaultValues: {
      name: subcategory.name,
      description: subcategory.description ?? "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (open)
      reset({
        name: subcategory.name,
        description: subcategory.description ?? "",
      });
  }, [open, subcategory.name, subcategory.description, reset]);

  const save = async () => {
    await update.mutateAsync(nodePatch(getValues()));
    onOpenChange(false);
  };

  return (
    <NodeDialog
      title="Edit subcategory"
      submitLabel="Save"
      control={control}
      onSubmit={save}
      isPending={update.isPending}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

type CaseTypeValues = NodeValues & {
  code: string;
  caseNumberPrefix: string;
  jurisdiction: CaseTypeJurisdiction;
};

/**
 * `SelectField` memoizes its collection, so this must not be rebuilt on
 * render — see the note on `SelectField`.
 */
const JURISDICTIONS = [
  { value: "federal", label: "Federal" },
  { value: "state", label: "State" },
  { value: "federal & state", label: "Federal & state" },
  { value: "varies", label: "Varies" },
];

function NewCaseTypeDialog({
  subcategoryId,
  open,
  onOpenChange,
}: {
  subcategoryId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateCaseType(subcategoryId);
  const { control, getValues, reset } = useForm<CaseTypeValues>({
    defaultValues: {
      code: "",
      name: "",
      caseNumberPrefix: "",
      jurisdiction: "federal",
      description: "",
    },
    mode: "onChange",
  });

  const save = async () => {
    const draft = getValues();
    await create.mutateAsync({
      code: draft.code.trim(),
      name: draft.name.trim(),
      caseNumberPrefix: draft.caseNumberPrefix.trim(),
      jurisdiction: draft.jurisdiction,
      description: draft.description.trim() || null,
    });
    reset();
    onOpenChange(false);
  };

  const extraFields = useMemo(
    () => (
      <>
        <TextField
          control={control}
          name="code"
          label="Code"
          mono
          placeholder="i-485-adjustment-of-status"
          transform={(value) => value.toLowerCase().replace(/\s+/g, "-")}
          rules={{
            required: "A code is needed.",
            pattern: {
              value: /^[a-z0-9]+(-[a-z0-9]+)*$/,
              message: "Lowercase letters, numbers and hyphens.",
            },
          }}
          hint="Settable now and never again — the seeds find this case type by it."
        />
        <TextField
          control={control}
          name="caseNumberPrefix"
          label="Case number prefix"
          mono
          placeholder="AOS"
          transform={(value) => value.toUpperCase()}
          rules={{
            required: "A prefix is needed.",
            pattern: {
              value: /^[A-Z0-9-]+$/,
              message: "Uppercase letters, numbers and hyphens.",
            },
          }}
          hint="Stamped into matter numbers as they are issued. Changing it later renames nothing that already exists."
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
      title="New case type"
      submitLabel="Create"
      control={control}
      blurb="The leaf. Once it exists you can give it a filing package and its intake and case questionnaires — until then a matter opened under it starts with nothing."
      namePlaceholder="I-485 — Adjustment of Status (Family-Based)"
      extraFields={extraFields}
      onSubmit={save}
      isPending={create.isPending}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
