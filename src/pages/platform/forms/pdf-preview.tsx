import { Alert, Box, Flex, HStack, Spinner, Text } from "@chakra-ui/react";

import { useFormPdfPreview } from "@/hooks/use-platform";
import { useObjectUrl } from "@/hooks/use-object-url";

/**
 * The form itself.
 *
 * ─── Why this view exists beside PDF boxes ──────────────────────────────────
 *
 * The boxes screen is a list of names — `Pt1Line1_FamilyName`,
 * `Pt1Line2_FamilyName` — and nothing on it says what those boxes are, where
 * they sit, or what USCIS asks in them. This is the blank they belong to,
 * exactly as it prints, so an operator wiring a key can read the question the
 * box is actually asking.
 *
 * Nothing is written into it. It once stamped every mapped box with the key
 * that claims it, which turned the document into 400 boxes of `beneficiary.*`
 * and left the tier with no view of the real paper at all.
 *
 * ─── An iframe, for the same reason the firm's preview uses one ─────────────
 *
 * Chakra has no PDF surface and neither does anything else we ship; the
 * browser's built-in viewer is good, and it handles a 512-box form better than
 * anything we would reach for. `useObjectUrl` is shared with that preview,
 * including the StrictMode trap in its docblock.
 */
export function FormPdfPreview({ formCode }: { formCode: string }) {
  const { data, isPending, isError, error } = useFormPdfPreview(formCode);
  const url = useObjectUrl(data?.blob);

  if (isPending) {
    return (
      <Flex justify="center" align="center" py={10} gap={2}>
        <Spinner size="sm" />
        <Text fontSize="13px" color="fg.muted">
          Rendering {formCode}…
        </Text>
      </Flex>
    );
  }

  if (isError || !url) {
    return (
      <Alert.Root status="info" size="sm">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Description fontSize="12px">
            {error instanceof Error
              ? error.message
              : `${formCode} has no blank on file, so there is nothing to preview.`}
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>
    );
  }

  return (
    <Box>
      {/*
        The counts above the document rather than under it. This is the number
        an operator came to the page for — "how much of this form is wired up" —
        and putting it below a full-height viewer means scrolling past the thing
        it describes to reach it.
      */}
      <HStack gap={2} mb={2.5} flexWrap="wrap">
        <Text fontSize="12px" color="fg.muted">
          <Text as="span" fontWeight="500" color="fg">
            {data.mapped}
          </Text>{" "}
          of {data.boxes} {data.boxes === 1 ? "box" : "boxes"} mapped
        </Text>
        {data.unmapped > 0 && (
          <Text fontSize="12px" color="fg.subtle">
            · {data.unmapped} not mapped yet
          </Text>
        )}
        {data.editionDate && (
          <Text fontSize="12px" color="fg.subtle">
            · {data.editionDate} edition
          </Text>
        )}
      </HStack>

      <Box
        as="iframe"
        // @ts-expect-error — Chakra's Box passes unknown props through to the
        // element, but its prop types do not include iframe attributes.
        src={url}
        title={`The ${formCode} blank`}
        w="full"
        h={{ base: "60vh", lg: "78vh" }}
        border="1px solid"
        borderColor="border"
        borderRadius="md"
        bg="bg.subtle"
      />

      <Text fontSize="11px" color="fg.subtle" mt={1.5} maxW="70ch">
        The official blank, unfilled. Which datum prints into which box is on
        the PDF boxes screen, which is also where a mapping is changed.
      </Text>
    </Box>
  );
}
