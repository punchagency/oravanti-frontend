import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import {
  Box,
  Field,
  Flex,
  Grid,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { Check, Eye, Save } from "lucide-react";
import { useState } from "react";
import { creatorAttorney, creatorCases } from "../data";

/** Read-only mirror of a value the template pulls from the case record. */
function PrefilledField({ label, value }: { label: string; value: string }) {
  return (
    <Field.Root>
      <Field.Label fontSize="13px" color="fg">
        {label}
      </Field.Label>
      <Input
        readOnly
        size="sm"
        value={value}
        bg="bg.muted"
        borderColor="border.muted"
        borderRadius="7px"
        fontSize="13px"
        color="fg.muted"
      />
    </Field.Root>
  );
}

export function MotionToContinueForm() {
  const [caseValue, setCaseValue] = useState("");
  const [filingDate, setFilingDate] = useState("2026-06-23");
  const [hearingDate, setHearingDate] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const record = creatorCases.find((c) => c.value === caseValue);

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" gap="16px">
        <Text fontSize="16px" fontWeight="600" color="fg">
          Motion to Continue
        </Text>
        <Text fontSize="12px" color="fg.muted">
          Pre-filled from case record
        </Text>
      </Flex>

      <Stack gap="16px" mt="18px">
        <Field.Root>
          <Field.Label fontSize="13px" color="fg">
            Linked case
          </Field.Label>
          <NativeSelect.Root size="sm" w="full">
            <NativeSelect.Field
              value={caseValue}
              onChange={(e) => setCaseValue(e.currentTarget.value)}
              bg="bg.input"
              borderColor="border.input"
              borderRadius="7px"
              fontSize="13px"
            >
              <option value="">Select a case...</option>
              {creatorCases.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Field.Root>

        <Box>
          <Text
            fontSize="10px"
            fontWeight="600"
            letterSpacing="0.06em"
            color="fg.subtle"
            textTransform="uppercase"
          >
            Auto-filled from case record
          </Text>
          <Grid
            mt="10px"
            templateColumns={{ base: "1fr", md: "1fr 1fr" }}
            gap="16px"
          >
            <PrefilledField label="Client name" value={record?.clientName ?? ""} />
            <PrefilledField label="A-Number" value={record?.aNumber ?? ""} />
            <PrefilledField label="Case number" value={record?.caseNumber ?? ""} />
            <PrefilledField
              label="Court / USCIS address"
              value={record?.courtAddress ?? ""}
            />
            <PrefilledField label="Attorney name" value={creatorAttorney.name} />
            <PrefilledField
              label="Bar number"
              value={creatorAttorney.barNumber}
            />
          </Grid>
        </Box>

        <Field.Root maxW={{ md: "50%" }}>
          <Field.Label fontSize="13px" color="fg">
            Filing date
          </Field.Label>
          <Input
            type="date"
            size="sm"
            value={filingDate}
            onChange={(e) => setFilingDate(e.target.value)}
            bg="bg.input"
            borderColor="border.input"
            borderRadius="7px"
            fontSize="13px"
          />
        </Field.Root>

        <Field.Root required>
          <Field.Label fontSize="13px" color="fg">
            Reason for continuance
            <Field.RequiredIndicator />
          </Field.Label>
          <Textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="State the specific reason the continuance is needed. Reference any pending documents, medical conditions, or extenuating circumstances."
            bg="bg.input"
            borderColor="border.input"
            borderRadius="7px"
            fontSize="13px"
          />
        </Field.Root>

        <Field.Root maxW={{ md: "260px" }}>
          <Field.Label fontSize="13px" color="fg">
            Requested new hearing date
          </Field.Label>
          <Input
            type="date"
            size="sm"
            value={hearingDate}
            onChange={(e) => setHearingDate(e.target.value)}
            bg="bg.input"
            borderColor="border.input"
            borderRadius="7px"
            fontSize="13px"
          />
        </Field.Root>

        <Field.Root>
          <Field.Label fontSize="13px" color="fg">
            Additional notes{" "}
            <Text as="span" color="fg.subtle" fontWeight="400">
              (optional)
            </Text>
          </Field.Label>
          <Textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            bg="bg.input"
            borderColor="border.input"
            borderRadius="7px"
            fontSize="13px"
          />
        </Field.Root>
      </Stack>

      <Flex
        mt="24px"
        pt="18px"
        borderTop="1px solid"
        borderColor="border.muted"
        justifyContent="flex-end"
        gap="8px"
        flexWrap="wrap"
      >
        <OutlineButton>
          <HStack gap="6px">
            <Save size={14} />
            <Text>Save as draft</Text>
          </HStack>
        </OutlineButton>
        <OutlineButton>
          <HStack gap="6px">
            <Eye size={14} />
            <Text>Preview document</Text>
          </HStack>
        </OutlineButton>
        <BrandButton>
          <HStack gap="6px">
            <Check size={14} />
            <Text>Finalize &amp; save to case</Text>
          </HStack>
        </BrandButton>
      </Flex>
    </Box>
  );
}
