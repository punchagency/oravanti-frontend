import {
  Button,
  Dialog,
  Input,
  InputGroup,
  Portal,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import type { CaseFormRole, PublishedForm } from "@/api/case-details";

/**
 * Put a form Oravanti publishes onto this matter.
 *
 * For the form the workflow template did not anticipate — an I-765 on a matter
 * that was not going to file one. The package normally comes from the template,
 * so this is the exception rather than the way forms usually arrive.
 *
 * ─── A picker, not a naming dialog ──────────────────────────────────────────
 *
 * This replaces one that asked for a code, a title and a description, and
 * created a catalogue entry as a side effect of adding a form to a matter. A
 * firm does not author forms — a typo in the code produced a form no catalogue
 * could ever match, and nobody found out until it printed empty weeks later.
 * Choosing from what exists makes that impossible rather than merely unlikely.
 */
export function AddFormDialog({
  forms,
  onList,
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  /** Everything Oravanti publishes. */
  forms: PublishedForm[];
  /** Codes already on this matter, so they are shown as such rather than offered. */
  onList: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (formCode: string, role: CaseFormRole) => Promise<unknown>;
  isPending: boolean;
}) {
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<string | null>(null);

  const already = useMemo(() => new Set(onList), [onList]);

  const shown = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return forms;
    return forms.filter((form) =>
      `${form.formCode} ${form.title}`.toLowerCase().includes(query),
    );
  }, [forms, search]);

  const close = () => {
    setSearch("");
    setPicked(null);
    onOpenChange(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => !details.open && close()}
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
                Add a form to this matter
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3} align="stretch">
                <Text fontSize="12px" color="fg.muted" lineHeight="17px">
                  The filing package normally comes from the workflow template.
                  Add a form here when this matter needs one the template did
                  not include.
                </Text>

                <InputGroup startElement={<Search size={13} />}>
                  <Input
                    size="sm"
                    fontSize="13px"
                    autoFocus
                    placeholder="Find a form by code or name…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </InputGroup>

                <Stack gap={1} maxH="280px" overflowY="auto">
                  {shown.length === 0 && (
                    <Text fontSize="13px" color="fg.muted" py={3}>
                      {forms.length === 0
                        ? "Oravanti has not published any forms yet."
                        : `No form matches “${search}”.`}
                    </Text>
                  )}

                  {shown.map((form) => {
                    const isOn = already.has(form.formCode);
                    const isPicked = picked === form.formCode;

                    return (
                      <Button
                        key={form.id}
                        variant="ghost"
                        size="sm"
                        h="auto"
                        gap={2}
                        px={2.5}
                        py={2}
                        justifyContent="flex-start"
                        fontWeight="400"
                        bg={isPicked ? "bg.emphasized" : "transparent"}
                        disabled={isOn}
                        onClick={() => setPicked(form.formCode)}
                      >
                        <Text
                          fontSize="12px"
                          fontFamily="mono"
                          fontWeight="600"
                          minW="52px"
                          flexShrink={0}
                          textAlign="start"
                        >
                          {form.formCode}
                        </Text>
                        <Text fontSize="13px" color="fg" truncate>
                          {form.title}
                        </Text>
                        {isOn && (
                          <Text fontSize="11px" color="fg.subtle" ml="auto">
                            already on
                          </Text>
                        )}
                      </Button>
                    );
                  })}
                </Stack>
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button size="sm" variant="ghost" onClick={close}>
                Cancel
              </Button>
              <Button
                layerStyle="brand-button"
                size="sm"
                fontSize="12px"
                h="32px"
                disabled={!picked}
                loading={isPending}
                /*
                  Added as `supporting` unless the workflow says otherwise.

                  A form somebody adds by hand is almost always a supporting
                  document — the core filings come from the template. Getting it
                  wrong costs a receipt column that should have been blank, and
                  the status can be changed on the form itself afterwards.
                */
                onClick={() => picked && onSubmit(picked, "supporting")}
              >
                Add form
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
