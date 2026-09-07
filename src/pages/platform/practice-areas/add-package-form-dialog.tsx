import {
  Button,
  Dialog,
  HStack,
  Portal,
  RadioGroup,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";

import {
  useCaseTypeAvailableForms,
  useSetCaseTypeForm,
} from "@/hooks/use-platform";
import { ListState, PagedFooter, SearchBox } from "../paged";
import { usePagedList } from "../use-paged-list";

/**
 * Puts a catalogued form on a case type's package.
 *
 * A picker over the catalogue, paginated and searchable like everything else,
 * and it offers only what is *not* already on the package — a picker that
 * offers what you have is a picker that mostly offers mistakes. The server
 * refuses a code it has never catalogued, so a form that would print blank
 * cannot be added by typing.
 */
export function AddPackageFormDialog({
  caseTypeId,
  open,
  onOpenChange,
}: {
  caseTypeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const list = usePagedList(8);
  const { data, isLoading } = useCaseTypeAvailableForms(
    open ? caseTypeId : undefined,
    list.params,
  );
  const setForm = useSetCaseTypeForm(caseTypeId);

  const [picked, setPicked] = useState<string | null>(null);
  const [role, setRole] = useState<"core" | "supporting">("core");

  const close = () => {
    setPicked(null);
    setRole("core");
    onOpenChange(false);
  };

  const forms = data?.data ?? [];

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
            maxW="500px"
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            bg="bg"
          >
            <Dialog.Header>
              <Dialog.Title fontSize="14px" fontWeight="600">
                Add a form to this package
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <VStack gap={3} align="stretch">
                <SearchBox
                  list={list}
                  placeholder="Find a form by code or name…"
                />

                <ListState
                  isLoading={isLoading && forms.length === 0}
                  isEmpty={!isLoading && forms.length === 0}
                  empty={
                    list.search
                      ? `No form matches “${list.search}”.`
                      : "Every catalogued form is already on this package."
                  }
                />

                <Stack gap={1}>
                  {forms.map((form) => (
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
                      bg={
                        picked === form.formCode
                          ? "bg.emphasized"
                          : "transparent"
                      }
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
                    </Button>
                  ))}
                </Stack>

                <PagedFooter list={list} total={data?.pagination.total ?? 0} />

                {/*
                  The role decides whether a receipt number is expected: USCIS
                  issues an I-797C per core form and none for a supporting
                  document, so a supporting form showing an empty receipt field
                  forever would read as missing data.
                */}
                <RadioGroup.Root
                  size="sm"
                  value={role}
                  onValueChange={(details) =>
                    setRole(details.value as "core" | "supporting")
                  }
                >
                  <HStack gap={4}>
                    <RadioGroup.Item value="core">
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemIndicator />
                      <RadioGroup.ItemText fontSize="12px">
                        Core — USCIS issues a receipt
                      </RadioGroup.ItemText>
                    </RadioGroup.Item>
                    <RadioGroup.Item value="supporting">
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemIndicator />
                      <RadioGroup.ItemText fontSize="12px">
                        Supporting
                      </RadioGroup.ItemText>
                    </RadioGroup.Item>
                  </HStack>
                </RadioGroup.Root>
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
                loading={setForm.isPending}
                onClick={() =>
                  picked &&
                  setForm.mutate(
                    { formCode: picked, role },
                    { onSuccess: close },
                  )
                }
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
