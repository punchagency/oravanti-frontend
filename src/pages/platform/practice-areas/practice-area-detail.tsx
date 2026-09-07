import { Box, Button, Card, HStack, SimpleGrid, Text } from "@chakra-ui/react";
import { ChevronRight, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";

import { TextField } from "@/components/ui/bound-fields";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  useCreateSubcategory,
  useDeletePracticeArea,
  usePracticeArea,
  useSubcategories,
  useUpdatePracticeArea,
} from "@/hooks/use-platform";
import { PlatformSectionHeader } from "../page-header";
import { NodeActions, NodeDialog, NodeHeading, StatusBadge } from "./node";
import { nodePatch, type NodeValues } from "./node-values";
import { ListState, PagedFooter, SearchBox } from "../paged";
import { usePagedList } from "../use-paged-list";

/**
 * One practice area: what it covers, and the subcategories under it.
 *
 * Two queries rather than one. The header is the node itself and does not
 * change when somebody pages or searches through its children; folding the two
 * together would re-fetch the description on every keystroke and make the
 * heading flicker while the list settles.
 */
export function PlatformPracticeAreaDetailPage() {
  const { practiceAreaId } = useParams<{ practiceAreaId: string }>();
  const navigate = useNavigate();

  const { data: area } = usePracticeArea(practiceAreaId);
  const list = usePagedList(12);
  const { data, isLoading } = useSubcategories(practiceAreaId, list.params);

  const update = useUpdatePracticeArea(practiceAreaId ?? "");
  const remove = useDeletePracticeArea();

  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  useDocumentTitle(`${area?.name ?? "Practice area"} · Oravanti`);

  const subcategories = data?.data ?? [];

  return (
    <Box maxW="1100px">
      {/*
        Rendered before `area` arrives, on its placeholder title. The children
        list comes from its own query and there is no reason to hold the whole
        screen back for a name.
      */}
      <NodeHeading
        trail={[{ label: "Practice areas", to: "/platform/practice-areas" }]}
        title={area?.name ?? "Practice area"}
        status={area?.status ?? "active"}
        description={area?.description ?? null}
        meta={
          area && (
            <Text fontSize="12px" color="fg.muted">
              {area.subcategoryCount} subcategories · {area.caseTypeCount} case
              types
            </Text>
          )
        }
        actions={
          area && (
            <NodeActions
              what="practice area"
              name={area.name}
              status={area.status}
              onEdit={() => setIsEditing(true)}
              onSetStatus={(status) => update.mutate({ status })}
              onDelete={async () => {
                await remove.mutateAsync(area.id);
                navigate("/platform/practice-areas");
              }}
              isBusy={update.isPending || remove.isPending}
            />
          )
        }
      />

      <PlatformSectionHeader
        title="Subcategories"
        actions={
          <Button
            size="sm"
            layerStyle="brand-button"
            onClick={() => setIsAdding(true)}
          >
            <Plus size={14} />
            New subcategory
          </Button>
        }
        toolbar={<SearchBox list={list} placeholder="Find a subcategory…" />}
      />

      <ListState
        isLoading={isLoading && subcategories.length === 0}
        isEmpty={!isLoading && subcategories.length === 0}
        empty={
          list.search
            ? `No subcategory matches “${list.search}”.`
            : "This practice area has no subcategories yet. Case types live under a subcategory, so this is the next step."
        }
      />

      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={3}>
        {subcategories.map((subcategory) => (
          <Card.Root
            key={subcategory.id}
            size="sm"
            borderColor="border"
            _hover={{ borderColor: "border.emphasized" }}
            transition="border-color 120ms"
            opacity={subcategory.status === "archived" ? 0.65 : 1}
          >
            <Card.Body>
              <Link to={`/platform/subcategories/${subcategory.id}`}>
                <HStack justify="space-between" gap={2} mb={1}>
                  <HStack gap={2} minW={0}>
                    <Text fontSize="13px" fontWeight="500" color="fg" truncate>
                      {subcategory.name}
                    </Text>
                    <StatusBadge status={subcategory.status} />
                  </HStack>
                  <ChevronRight
                    size={14}
                    color="var(--chakra-colors-fg-subtle)"
                  />
                </HStack>
                <Text fontSize="12px" color="fg.muted">
                  {subcategory.caseTypeCount} case types
                </Text>
                {subcategory.description && (
                  <Text
                    fontSize="12px"
                    color="fg.subtle"
                    mt={1.5}
                    lineHeight="17px"
                    lineClamp={2}
                  >
                    {subcategory.description}
                  </Text>
                )}
              </Link>
            </Card.Body>
          </Card.Root>
        ))}
      </SimpleGrid>

      <PagedFooter list={list} total={data?.pagination.total ?? 0} />

      {area && (
        <EditPracticeAreaDialog
          area={area}
          open={isEditing}
          onOpenChange={setIsEditing}
        />
      )}
      {practiceAreaId && (
        <NewSubcategoryDialog
          practiceAreaId={practiceAreaId}
          open={isAdding}
          onOpenChange={setIsAdding}
        />
      )}
    </Box>
  );
}

function EditPracticeAreaDialog({
  area,
  open,
  onOpenChange,
}: {
  area: { id: string; name: string; description: string | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const update = useUpdatePracticeArea(area.id);
  const { control, getValues, reset } = useForm<NodeValues>({
    defaultValues: { name: area.name, description: area.description ?? "" },
    mode: "onChange",
  });

  /*
    Re-seeded when the dialog opens, not when the record changes. Opening is
    the moment the values are read; re-seeding on every fetch would discard
    what somebody had typed the instant a background refetch landed.
  */
  useEffect(() => {
    if (open) reset({ name: area.name, description: area.description ?? "" });
  }, [open, area.name, area.description, reset]);

  const save = async () => {
    await update.mutateAsync(nodePatch(getValues()));
    onOpenChange(false);
  };

  return (
    <NodeDialog
      title="Edit practice area"
      submitLabel="Save"
      control={control}
      onSubmit={save}
      isPending={update.isPending}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}

function NewSubcategoryDialog({
  practiceAreaId,
  open,
  onOpenChange,
}: {
  practiceAreaId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreateSubcategory(practiceAreaId);
  const { control, getValues, reset } = useForm<NodeValues & { code: string }>({
    defaultValues: { code: "", name: "", description: "" },
    mode: "onChange",
  });

  const save = async () => {
    const draft = getValues();
    await create.mutateAsync({
      code: draft.code.trim(),
      name: draft.name.trim(),
      description: draft.description.trim() || null,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <NodeDialog
      title="New subcategory"
      submitLabel="Create"
      control={control}
      blurb="A subcategory groups case types. It is a real level rather than a detour — Immigration alone holds around 150 case types, and a flat list of those is a page nobody reads."
      namePlaceholder="Family-Based Immigration"
      extraFields={
        <TextField
          control={control}
          name="code"
          label="Code"
          mono
          placeholder="family-based-immigration"
          transform={(value) => value.toLowerCase().replace(/\s+/g, "-")}
          rules={{
            required: "A code is needed.",
            pattern: {
              value: /^[a-z0-9]+(-[a-z0-9]+)*$/,
              message: "Lowercase letters, numbers and hyphens.",
            },
          }}
          hint="Settable now and never again — the seeds find this subcategory by it. The name is what a rename changes."
        />
      }
      onSubmit={save}
      isPending={create.isPending}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
