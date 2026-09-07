import { Box, Button, Card, HStack, SimpleGrid, Text } from "@chakra-ui/react";
import { ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useForm } from "react-hook-form";

import { PlatformPageHeader } from "../page-header";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useCreatePracticeArea, usePracticeAreas } from "@/hooks/use-platform";
import { NodeDialog, StatusBadge } from "./node";
import type { NodeValues } from "./node-values";
import { ListState, PagedFooter, SearchBox } from "../paged";
import { usePagedList } from "../use-paged-list";

/**
 * The top of the tree.
 *
 * ─── Why the CRM is organised this way ──────────────────────────────────────
 *
 * A form and a questionnaire are both answers to the same question — *what
 * does this kind of matter need?* — so both are reached the same way: practice
 * area, then subcategory, then case type, then the package or the
 * questionnaire. The flat catalogue under Forms is still there and still the
 * place to say what an I-485 asks; this is the place to say who files it.
 *
 * The counts are the point of this screen. "Immigration Law — 7 subcategories,
 * 152 case types" tells an operator where the work is before they click, and
 * the taxonomy is lopsided enough that guessing is a real cost.
 */
export function PlatformPracticeAreasPage() {
  useDocumentTitle("Practice areas · Oravanti");

  const list = usePagedList(12);
  const { data, isLoading } = usePracticeAreas(list.params);
  const [isAdding, setIsAdding] = useState(false);

  const areas = data?.data ?? [];

  return (
    <Box maxW="1100px">
      <PlatformPageHeader
        title="Practice areas"
        description="What each kind of matter files and what it asks. Every firm on the platform works from these."
        actions={
          <Button
            size="sm"
            layerStyle="brand-button"
            onClick={() => setIsAdding(true)}
          >
            <Plus size={14} />
            New practice area
          </Button>
        }
        toolbar={<SearchBox list={list} placeholder="Find a practice area…" />}
      />

      <ListState
        isLoading={isLoading && areas.length === 0}
        isEmpty={!isLoading && areas.length === 0}
        empty={
          list.search
            ? `No practice area matches “${list.search}”.`
            : "No practice areas yet. Run the taxonomy seed, or add the first one."
        }
      />

      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={3}>
        {areas.map((area) => (
          <Card.Root
            key={area.id}
            size="sm"
            borderColor="border"
            _hover={{ borderColor: "border.emphasized" }}
            transition="border-color 120ms"
            /* An archived area is still listed here — this is where it is
               restored from — but it should not read as one that is live. */
            opacity={area.status === "archived" ? 0.65 : 1}
          >
            <Card.Body>
              <Link to={`/platform/practice-areas/${area.id}`}>
                <HStack justify="space-between" gap={2} mb={1}>
                  <HStack gap={2} minW={0}>
                    <Text fontSize="13px" fontWeight="500" color="fg" truncate>
                      {area.name}
                    </Text>
                    <StatusBadge status={area.status} />
                  </HStack>
                  <ChevronRight
                    size={14}
                    color="var(--chakra-colors-fg-subtle)"
                  />
                </HStack>
                <Text fontSize="12px" color="fg.muted">
                  {area.subcategoryCount} subcategories · {area.caseTypeCount}{" "}
                  case types
                </Text>
                {area.description && (
                  <Text
                    fontSize="12px"
                    color="fg.subtle"
                    mt={1.5}
                    lineHeight="17px"
                    lineClamp={2}
                  >
                    {area.description}
                  </Text>
                )}
              </Link>
            </Card.Body>
          </Card.Root>
        ))}
      </SimpleGrid>

      <PagedFooter list={list} total={data?.pagination.total ?? 0} />

      <NewPracticeAreaDialog open={isAdding} onOpenChange={setIsAdding} />
    </Box>
  );
}

function NewPracticeAreaDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const create = useCreatePracticeArea();
  const { control, getValues, reset } = useForm<NodeValues>({
    defaultValues: { name: "", description: "" },
    mode: "onChange",
  });

  const save = async () => {
    const draft = getValues();
    await create.mutateAsync({
      name: draft.name.trim(),
      description: draft.description.trim() || null,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <NodeDialog
      title="New practice area"
      submitLabel="Create"
      control={control}
      blurb="The top of the tree. Subcategories and case types are added underneath it afterwards — a practice area on its own offers a firm nothing yet."
      namePlaceholder="Immigration Law"
      onSubmit={save}
      isPending={create.isPending}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
