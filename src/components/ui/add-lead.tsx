import {
  BrandButton,
  OutlineButton,
} from "@/components/ui/intake-ui";
import { leadSources } from "@/pages/admin/intake/data";
import {
  Box,
  Dialog,
  Flex,
  Grid,
  Input,
  Text,
  Textarea,
  VStack,
  chakra,
} from "@chakra-ui/react";
import { UserPlus, X } from "lucide-react";
import { useState, type ReactNode } from "react";

export function AddLeadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [practiceArea, setPracticeArea] = useState("");
  const [caseType, setCaseType] = useState("");
  const caseTypeOptions = practiceArea
    ? (caseTypesByPracticeArea[practiceArea] ?? defaultCaseTypes)
    : [];

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
      placement="center"
    >
      <Dialog.Backdrop bg="rgba(0, 0, 0, 0.46)" />
      <Dialog.Positioner px="16px">
        <Dialog.Content
          w="full"
          maxW="480px"
          border="1px solid"
          borderColor="border"
          borderRadius="14px"
          bg="bg"
          p="0"
          boxShadow="0 24px 70px rgba(0, 0, 0, 0.26)"
        >
          <chakra.button
            type="button"
            aria-label="Close add lead dialog"
            position="absolute"
            top="22px"
            right="22px"
            display="grid"
            placeItems="center"
            w="32px"
            h="32px"
            border="1px solid"
            borderColor="border"
            borderRadius="8px"
            bg="bg"
            color="fg.muted"
            onClick={() => onOpenChange(false)}
          >
            <X size={16} />
          </chakra.button>

          <Box
            as="form"
            p="32px 24px 24px"
            onSubmit={(event) => {
              event.preventDefault();
              onOpenChange(false);
            }}
          >
            <Dialog.Title
              color="fg"
              fontSize="17px"
              fontWeight="600"
              lineHeight="1.2"
            >
              Add lead manually
            </Dialog.Title>
            <Dialog.Description
              mt="10px"
              color="fg.muted"
              fontSize="13px"
              lineHeight="1.35"
            >
              For walk-ins, phone enquiries, or referrals that came directly to
              the firm.
            </Dialog.Description>

            <VStack align="stretch" gap="12px" mt="18px">
              <Grid
                templateColumns={{
                  base: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                }}
                gap="10px"
              >
                <FormField label="First name">
                  <Input placeholder="e.g. Sandra" {...fieldStyles} />
                </FormField>
                <FormField label="Last name">
                  <Input placeholder="e.g. Osei" {...fieldStyles} />
                </FormField>
              </Grid>

              <FormField label="Email address">
                <Input
                  type="email"
                  placeholder="e.g. sandra@example.com"
                  {...fieldStyles}
                />
              </FormField>

              <FormField label="Phone number">
                <Input
                  type="tel"
                  placeholder="e.g. +1 (555) 012-3456"
                  {...fieldStyles}
                />
              </FormField>

              <FormField label="Practice area interest">
                <chakra.select
                  value={practiceArea}
                  onChange={(event) => {
                    setPracticeArea(event.currentTarget.value);
                    setCaseType("");
                  }}
                  {...selectStyles}
                >
                  <option value="">Select practice area</option>
                  {practiceAreaOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </chakra.select>
              </FormField>

              <FormField label="Case type">
                <chakra.select
                  {...selectStyles}
                  value={caseType}
                  onChange={(event) => setCaseType(event.currentTarget.value)}
                  disabled={!practiceArea}
                  opacity={practiceArea ? 1 : 0.62}
                  cursor={practiceArea ? "pointer" : "not-allowed"}
                >
                  <option value="">
                    {practiceArea
                      ? "Select case type"
                      : "Select practice area first"}
                  </option>
                  {caseTypeOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </chakra.select>
              </FormField>

              <FormField label="Source">
                <chakra.select defaultValue="Direct" {...selectStyles}>
                  {leadSources.map((source) => (
                    <option key={source}>{source}</option>
                  ))}
                </chakra.select>
              </FormField>

              <FormField label="Situation summary">
                <Textarea
                  minH="70px"
                  resize="vertical"
                  placeholder="Brief description of client's situation..."
                  {...fieldStyles}
                />
              </FormField>
            </VStack>

            <Flex justify="space-between" gap="12px" mt="18px">
              <OutlineButton type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </OutlineButton>
              <BrandButton type="submit" minW="152px">
                <UserPlus size={15} />
                Add to lead inbox
              </BrandButton>
            </Flex>
          </Box>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
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
    </Box>
  );
}

const fieldStyles = {
  h: "36px",
  px: "12px",
  border: "1px solid",
  borderColor: "border",
  borderRadius: "7px",
  bg: "bg",
  color: "fg",
  fontSize: "13px",
  _placeholder: { color: "fg.muted" },
  _focus: {
    borderColor: "brand.solid",
    boxShadow: "0 0 0 1px var(--brand-cta)",
  },
};

const practiceAreaOptions = [
  "Immigration (Active)",
  "Family law",
  "Business",
  "Criminal defense",
  "Personal injury",
] as const;

const defaultCaseTypes = ["General consultation"] as const;

const caseTypesByPracticeArea: Record<string, readonly string[]> = {
  "Immigration (Active)": [
    "Adjustment of status",
    "Family petition",
    "Naturalization",
    "Work authorization",
  ],
  "Family law": [
    "Divorce / dissolution",
    "Prenuptial agreement",
    "Child custody",
    "Support modification",
  ],
  Business: [
    "Entity formation",
    "Contract review",
    "S-Corp election",
    "Corporate registry",
  ],
  "Criminal defense": [
    "Misdemeanor defense",
    "Felony defense",
    "DUI / traffic",
    "Record expungement",
  ],
  "Personal injury": [
    "Auto accident",
    "Premises liability",
    "Medical negligence",
    "Contingency review",
  ],
};

const selectStyles = {
  w: "full",
  h: "36px",
  px: "12px",
  border: "1px solid",
  borderColor: "border",
  borderRadius: "7px",
  bg: "bg",
  color: "fg",
  fontSize: "13px",
  cursor: "pointer",
  _focus: {
    borderColor: "brand.solid",
    boxShadow: "0 0 0 1px var(--brand-cta)",
  },
};
