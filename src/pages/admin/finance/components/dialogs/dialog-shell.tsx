import { Box, Dialog, HStack, Portal, Text, chakra } from "@chakra-ui/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Shared frame for the finance dialogs.
 *
 * `lazyMount` + `unmountOnExit` keep Dialog.Root mounted while closed —
 * conditionally unmounting it on the open state breaks Chakra's focus trap, so
 * callers pass `open` rather than rendering the dialog conditionally.
 */
export function DialogShell({
  open,
  onOpenChange,
  title,
  subtitle,
  footer,
  children,
  size = "lg",
}: {
  open: boolean;
  onOpenChange: (details: { open: boolean }) => void;
  title: ReactNode;
  subtitle?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
      size={size}
      placement="center"
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            borderRadius="14px"
            bg="bg"
            border="1px solid"
            borderColor="border"
            boxShadow="0 24px 70px rgba(0,0,0,0.26)"
          >
            <Dialog.Header
              px="22px"
              py="18px"
              borderBottom="1px solid"
              borderColor="border"
            >
              <HStack justify="space-between" w="100%" align="flex-start">
                <Box>
                  <Dialog.Title fontSize="16px" fontWeight="600">
                    {title}
                  </Dialog.Title>
                  {subtitle && (
                    <Text fontSize="12px" color="fg.muted" mt="2px">
                      {subtitle}
                    </Text>
                  )}
                </Box>
                <Dialog.CloseTrigger asChild>
                  <chakra.button
                    type="button"
                    display="grid"
                    placeItems="center"
                    w="30px"
                    h="30px"
                    borderRadius="50%"
                    color="fg.muted"
                    cursor="pointer"
                    flexShrink={0}
                    _hover={{ bg: "bg.subtle" }}
                  >
                    <X size={15} />
                  </chakra.button>
                </Dialog.CloseTrigger>
              </HStack>
            </Dialog.Header>

            <Dialog.Body px="22px" py="20px" maxH="65vh" overflowY="auto">
              {children}
            </Dialog.Body>

            {footer && (
              <Dialog.Footer
                px="22px"
                py="16px"
                borderTop="1px solid"
                borderColor="border"
                bg="bg.subtle"
                borderBottomRadius="14px"
              >
                {footer}
              </Dialog.Footer>
            )}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Text
        as="label"
        display="block"
        mb="5px"
        color="fg"
        fontSize="11px"
        fontWeight="500"
      >
        {label}
      </Text>
      {children}
      {hint && !error && (
        <Text m="4px 0 0" color="fg.muted" fontSize="11px">
          {hint}
        </Text>
      )}
      {error && (
        <Text m="4px 0 0" color="#c0392b" fontSize="11px">
          {error}
        </Text>
      )}
    </Box>
  );
}
