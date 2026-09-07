import {
  Badge,
  Box,
  Button,
  Card,
  HStack,
  SimpleGrid,
  Text,
  Wrap,
} from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import {
  useAddCatalogueForm,
  useCatalogueForms,
  usePracticeAreas,
} from "@/hooks/use-platform";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { FormDefinitionDialog } from "./form-definition-dialog";
import { PlatformPageHeader } from "../page-header";
import { ListState, PagedFooter, SearchBox } from "../paged";
import { usePagedList } from "../use-paged-list";

/**
 * Every form Oravanti publishes.
 *
 * The catalogue is the spine of the whole tier: a form has to exist here before
 * any firm can put it on a matter, and what is on it here is what every firm
 * sees. Naming a form is deliberately cheap and deliberately separate from
 * filling one in — this page creates the entry, and the detail page behind each
 * card is where its fields and wiring live.
 *
 * ─── Why the practice area is a filter and not a folder ─────────────────────
 *
 * A form is not *in* a practice area. The I-864 is filed on a family-based
 * adjustment and on an employment-based one, and the I-693 on both of those and
 * on asylum. Filing it under one of them would be a lie the catalogue then has
 * to maintain, and a second copy is worse: two I-864s with two sets of box
 * mappings, drifting.
 *
 * So the practice area is derived from the packages that name the form —
 * `case_type_forms`, the same one table the case-type page reads in the other
 * direction — and it narrows the list rather than nesting it. A form on nobody's
 * package yet still appears here, unbadged, which is the honest rendering of a
 * form that has been catalogued and not yet put to work.
 */
export function PlatformFormsPage() {
  useDocumentTitle("Forms · Oravanti");

  /*
    Searched on the server, not in the browser. It used to filter a whole
    catalogue held in memory, which was fine at a few dozen forms and is the
    kind of thing that stops being fine without anyone noticing.
  */
  const list = usePagedList(12);
  const [areaId, setAreaId] = useState<string | undefined>();
  const { data, isLoading } = useCatalogueForms({
    ...list.params,
    practiceAreaId: areaId,
  });

  // Eight rows, and the only level of the taxonomy small enough to show whole.
  const { data: areas } = usePracticeAreas({ limit: 100 });
  const addForm = useAddCatalogueForm();

  const [isAdding, setIsAdding] = useState(false);

  const shown = data?.data ?? [];
  const areaName = areas?.data.find((area) => area.id === areaId)?.name;

  return (
    <Box maxW="1100px">
      <PlatformPageHeader
        title="Forms"
        description="Every form firms can put on a matter. They fill these in and print them; only you can change what a form is or which boxes it has."
        actions={
          <Button
            size="sm"
            layerStyle="brand-button"
            onClick={() => setIsAdding(true)}
          >
            <Plus size={14} />
            Add form
          </Button>
        }
        toolbar={
          <SearchBox list={list} placeholder="Find a form by code or name…" />
        }
      />

      {/*
        Chips rather than a select: eight is few enough to read at a glance, and
        seeing the whole taxonomy is itself the answer to "what do we publish
        forms for". A select would hide seven of the eight behind a click.
      */}
      <Wrap gap={1.5} mb={4}>
        <Button
          size="xs"
          fontSize="12px"
          variant={areaId ? "outline" : "subtle"}
          onClick={() => {
            setAreaId(undefined);
            list.setPage(1);
          }}
        >
          All forms
        </Button>

        {areas?.data.map((area) => (
          <Button
            key={area.id}
            size="xs"
            fontSize="12px"
            variant={areaId === area.id ? "subtle" : "outline"}
            onClick={() => {
              // Toggles off, and resets the page for the same reason searching
              // does: page 3 of the unfiltered list is often past the end of
              // the filtered one, and the screen would go blank with no error.
              setAreaId((current) =>
                current === area.id ? undefined : area.id,
              );
              list.setPage(1);
            }}
          >
            {area.name}
          </Button>
        ))}
      </Wrap>

      <ListState
        isLoading={isLoading && shown.length === 0}
        isEmpty={!isLoading && shown.length === 0}
        empty={
          list.search
            ? `No form matches “${list.search}”${areaName ? ` in ${areaName}` : ""}.`
            : areaName
              ? `No form is for ${areaName} yet.`
              : "No forms yet. Add one, then upload its PDF."
        }
      />

      <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={3}>
        {shown.map((form) => (
          <Card.Root
            key={form.id}
            size="sm"
            borderColor="border"
            _hover={{ borderColor: "border.emphasized" }}
            transition="border-color 120ms"
          >
            <Card.Body>
              {/*
                The whole card is the link, not a button inside it. There is
                exactly one thing to do with a form here — open it — and a card
                that looks clickable but only responds on a small target is the
                kind of thing people click twice.
              */}
              <Link to={`/platform/forms/${form.formCode}`}>
                <Text fontSize="13px" fontWeight="600" fontFamily="mono">
                  {form.formCode}
                </Text>
                <Text fontSize="13px" color="fg" mt={1} lineHeight="18px">
                  {form.title}
                </Text>
                {form.description && (
                  <Text
                    fontSize="12px"
                    color="fg.muted"
                    mt={1.5}
                    lineHeight="17px"
                    lineClamp={2}
                  >
                    {form.description}
                  </Text>
                )}

                <HStack gap={1} mt={2.5} flexWrap="wrap">
                  {/*
                    Flagged on the list, because it is the one property here
                    that changes what a firm can do rather than what it reads:
                    a form with this is not editable, not populated and not in
                    the merged package anywhere in the deployment.
                  */}
                  {form.providedBy && (
                    <Badge size="sm" variant="surface" colorPalette="orange">
                      Filled in outside the firm
                    </Badge>
                  )}
                  {form.practiceAreas.map((area) => (
                    <Badge key={area.id} size="sm" variant="surface">
                      {area.name}
                    </Badge>
                  ))}

                  {/*
                    Said plainly rather than left as an absence. These badges
                    are the union of what a form says it is for and what
                    actually files it, so an empty row means neither — either
                    somebody has not got to it or the form is a mistake, and
                    both are worth noticing from the list.
                  */}
                  {form.practiceAreas.length === 0 && (
                    <Text fontSize="11px" color="fg.subtle">
                      Not linked to any kind of work yet
                    </Text>
                  )}
                </HStack>
              </Link>
            </Card.Body>
          </Card.Root>
        ))}
      </SimpleGrid>

      <PagedFooter list={list} total={data?.pagination.total ?? 0} />

      <FormDefinitionDialog
        open={isAdding}
        onOpenChange={setIsAdding}
        isPending={addForm.isPending}
        onSubmit={async (values) => {
          await addForm.mutateAsync(values);
          setIsAdding(false);
        }}
      />
    </Box>
  );
}
