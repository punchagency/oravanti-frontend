import type { CaseForm } from "@/api/case-details";
import { Alert, Box, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { FileCheck2 } from "lucide-react";

/**
 * A form somebody outside the firm completes.
 *
 * ─── Why this is a screen and not a disabled editor ─────────────────────────
 *
 * The I-693 is filled in, signed and sealed by a USCIS-designated civil
 * surgeon. Nobody at the firm may open the envelope, let alone type into the
 * form — and a version of it filled from the client's answers would be a second
 * document disagreeing with the one actually filed.
 *
 * So the tab does not offer an editor here, greyed out or otherwise: a control
 * that exists and refuses is a promise the app cannot keep, the same argument
 * the Forms tab already makes about a firm editing the catalogue. It offers the
 * instruction, which is the thing a paralegal actually needs at this point.
 *
 * The package download leaves the form out for the same reason, and says so.
 */
export function ProvidedForm({
  form,
  instruction,
}: {
  form: CaseForm;
  /** What to do, from the catalogue. See `form_definitions.provided_by`. */
  instruction: string;
}) {
  return (
    <Box border="1px solid" borderColor="border" borderRadius="md" p={5}>
      <Flex justify="space-between" align="flex-start" gap={4} flexWrap="wrap">
        <Box minW={0}>
          <HStack gap={2} align="baseline" flexWrap="wrap">
            <Text fontSize="15px" fontWeight="500" color="fg">
              {form.definition?.title ?? form.formCode}
            </Text>
            <Text fontSize="12px" color="fg.muted">
              {form.formCode}
            </Text>
          </HStack>
          {form.definition?.description && (
            <Text fontSize="13px" color="fg.muted" mt={1} lineHeight="18px">
              {form.definition.description}
            </Text>
          )}
        </Box>
      </Flex>

      <Alert.Root status="info" variant="subtle" mt={4} borderRadius="sm">
        <Alert.Indicator>
          <FileCheck2 size={16} />
        </Alert.Indicator>
        <Alert.Content>
          <Alert.Title fontSize="13px" fontWeight="500">
            This form is not filled in here
          </Alert.Title>
          <Alert.Description fontSize="13px" lineHeight="19px">
            {instruction}
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>

      <VStack align="stretch" gap={1} mt={4}>
        <Text fontSize="12px" color="fg.muted" lineHeight="17px">
          Record the civil surgeon's signature date on the Immigration details
          panel — the I-693 has no fixed validity window of its own, and that
          date is what ties it to the application it was filed with.
        </Text>
      </VStack>
    </Box>
  );
}
