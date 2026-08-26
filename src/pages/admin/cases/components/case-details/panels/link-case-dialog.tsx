import { Box, Button, Dialog, Portal, Text, VStack } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import type { CaseRelationType } from "@/api/workflows";
import { FormSelect } from "@/components/ui/form-select";
import {
  SearchableSelect,
  type SearchableOption,
} from "@/components/ui/searchable-select";
import { useCases } from "@/hooks/use-cases";
import { useCaseLink } from "@/hooks/use-workflows";

const RELATION_TYPES = [
  { label: "Writ of mandamus", value: "mandamus" },
  { label: "Appeal", value: "appeal" },
  { label: "Related matter", value: "related_matter" },
];

const schema = z.object({
  childCaseId: z.string().uuid("Pick a case to link"),
  relationType: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

/**
 * Links an existing case to this one.
 *
 * Generic over relation type on purpose: `appeal` and `related_matter` already
 * exist in the schema alongside `mandamus`, the only one with a user today, and
 * building this generically costs nothing over building it mandamus-only.
 *
 * It links an existing case — it never creates one. Opening a mandamus matter
 * is a deliberate act with its own case record; this is the second half of it.
 */
export function LinkCaseDialog({
  parentCaseId,
  defaultRelationType = "related_matter",
  triggerLabel = "Link related case",
}: {
  parentCaseId: string;
  defaultRelationType?: CaseRelationType;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  /*
    Deliberately not a form field. It is a query parameter for the case search
    below — never submitted, never validated, and it changes on every keystroke.
    Putting it in the form would re-render the whole dialog per character to
    hold something the form does not send.
  */
  const [search, setSearch] = useState("");

  const EMPTY: FormValues = { childCaseId: "", relationType: defaultRelationType };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
    mode: "onTouched",
  });

  const link = useCaseLink(parentCaseId);
  // Nothing is fetched until the dialog has been opened at least once.
  const { data: cases, isFetching } = useCases(open ? { search, limit: 20 } : {});

  const options = useMemo<SearchableOption[]>(
    () =>
      (cases?.data ?? [])
        // A case cannot be its own related matter.
        .filter((c) => c.id !== parentCaseId)
        .map((c) => ({
          value: c.id,
          label: c.caseNumber,
          sublabel: [c.client?.name, c.caseType?.name].filter(Boolean).join(" · "),
        })),
    [cases, parentCaseId],
  );

  const onSubmit = handleSubmit((values) =>
    link.mutate(
      { childCaseId: values.childCaseId, relationType: values.relationType as CaseRelationType },
      { onSuccess: () => setOpen(false) },
    ),
  );

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        setOpen(details.open);
        if (!details.open) {
          reset(EMPTY);
          setSearch("");
        }
      }}
      size="sm"
    >
      <Dialog.Trigger asChild>
        <Button size="xs" variant="outline" borderColor="border" h="26px" fontSize="11px">
          <Link2 size={11} />
          {triggerLabel}
        </Button>
      </Dialog.Trigger>

      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="440px"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            bg="bg"
          >
            <Dialog.Header>
              <Dialog.Title fontSize="14px" fontWeight="600">
                Link a case
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3} align="stretch">
                <Text fontSize="12px" color="fg.muted">
                  Links an existing matter to this one. Create the case first if it
                  doesn't exist yet.
                </Text>

                <Box>
                  <Text fontSize="10px" fontWeight="500" color="fg.subtle" textTransform="uppercase" mb={1}>
                    Case
                  </Text>
                  <Controller
                    name="childCaseId"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        remote
                        value={field.value}
                        onChange={field.onChange}
                        options={options}
                        loading={isFetching}
                        loadingText="Searching cases…"
                        placeholder="Search by case number or client…"
                        searchPlaceholder="Search cases…"
                        emptyText="No matching cases"
                        ariaLabel="Case to link"
                        onSearchChange={setSearch}
                      />
                    )}
                  />
                  {errors.childCaseId && (
                    <Text fontSize="10px" color="fg.error" mt={1}>
                      {errors.childCaseId.message}
                    </Text>
                  )}
                </Box>

                <Box>
                  <Text fontSize="10px" fontWeight="500" color="fg.subtle" textTransform="uppercase" mb={1}>
                    Relationship
                  </Text>
                  <Controller
                    name="relationType"
                    control={control}
                    render={({ field }) => (
                      <FormSelect
                        options={RELATION_TYPES}
                        value={field.value}
                        onChange={field.onChange}
                        ariaLabel="Relationship"
                      />
                    )}
                  />
                </Box>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer gap={2}>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" borderColor="border" size="sm" fontSize="12px" h="32px">
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="brand"
                size="sm"
                fontSize="12px"
                h="32px"
                loading={link.isPending}
                onClick={onSubmit}
              >
                Link case
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
