import {
  Box,
  Dialog,
  Flex,
  Grid,
  HStack,
  Input,
  Link,
  Text,
  Textarea,
  VStack,
  chakra,
} from "@chakra-ui/react";
import { Download, Plus, UserPlus, X } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router";
import { intakeStages, intakeTabs, leadSources } from "../data";
import { BrandButton, OutlineButton } from "./intake-ui";

export function PipelineFrame({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  return (
    <>
      <Flex
        as="header"
        align="flex-start"
        justify="space-between"
        gap="16px"
        py="28px"
        pb="16px"
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Box>
          <Text as="h1" m="0" color="fg" fontSize="22px" fontWeight="500" lineHeight="1.2">
            Intake pipeline
          </Text>
          <Text m="6px 0 0" color="fg.muted" fontSize="13px">
            Manage leads from first contact to active case
          </Text>
        </Box>
        <HStack gap="8px">
          <BrandButton onClick={() => setAddLeadOpen(true)}>
            <Plus size={15} />
            Add lead
          </BrandButton>
          <OutlineButton>
            <Download size={14} />
            Export
          </OutlineButton>
        </HStack>
      </Flex>

      <Box
        as="section"
        display="grid"
        gridTemplateColumns={{ base: "repeat(3, minmax(0, 1fr))", xl: "repeat(6, minmax(0, 1fr))" }}
        rowGap="18px"
        mt="34px"
        mb="28px"
        pb="28px"
        borderBottom="1px solid"
        borderColor="border.subtle"
        aria-label="Intake pipeline stages"
      >
        {intakeStages.map((stage, index) => {
          const active = location.pathname === stage.path;

          return (
            <Link
              key={stage.path}
              asChild
              display="block"
              w="full"
              textDecoration="none"
              _focus={{ outline: "none", boxShadow: "none" }}
              _focusVisible={{
                outline: "2px solid",
                outlineColor: "brand.solid",
                outlineOffset: "4px",
                borderRadius: "8px",
              }}
            >
              <RouterLink to={stage.path}>
                <VStack position="relative" w="full" gap="6px" textAlign="center">
                  {index > 0 ? (
                    <Box
                      position="absolute"
                      top="14px"
                      left="-50%"
                      w="100%"
                      h="2px"
                      bg="border"
                    />
                  ) : null}
                  <Box
                    zIndex="1"
                    display="grid"
                    placeItems="center"
                    w="28px"
                    h="28px"
                    border="2px solid"
                    borderColor={stage.color}
                    borderRadius="full"
                    bg="bg"
                    color={stage.color}
                    fontSize="13px"
                    fontWeight="500"
                    boxShadow={active ? `0 0 0 3px ${stage.color}1f` : undefined}
                  >
                    {index + 1}
                  </Box>
                  <Text m="0" color="fg" fontSize="11px" fontWeight="500" lineHeight="1.1">
                    {stage.label}
                  </Text>
                  <Text m="0" color="fg.muted" fontSize="11px" lineHeight="1.1">
                    {stage.countLabel}
                  </Text>
                </VStack>
              </RouterLink>
            </Link>
          );
        })}
      </Box>

      <HStack
        as="nav"
        gap="18px"
        borderBottom="1px solid"
        borderColor="border.subtle"
        overflowX="auto"
        aria-label="Intake pipeline views"
      >
        {intakeTabs.map(([label, path]) => {
          const active = location.pathname === path;

          return (
            <Link
              key={path}
              asChild
              textDecoration="none"
              _focus={{ outline: "none", boxShadow: "none" }}
              _focusVisible={{
                outline: "2px solid",
                outlineColor: "brand.solid",
                outlineOffset: "2px",
                borderRadius: "6px",
              }}
            >
              <RouterLink to={path}>
                <Box
                  display="inline-flex"
                  alignItems="center"
                  minH="42px"
                  px="12px"
                  borderBottom="2px solid"
                  borderColor={active ? "brand.solid" : "transparent"}
                  color={active ? "fg" : "fg.muted"}
                  fontSize="13px"
                  fontWeight={active ? "500" : "400"}
                  whiteSpace="nowrap"
                >
                  {label}
                </Box>
              </RouterLink>
            </Link>
          );
        })}
      </HStack>

      {children}

      <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} />
    </>
  );
}

function AddLeadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [practiceArea, setPracticeArea] = useState("");
  const [caseType, setCaseType] = useState("");
  const caseTypeOptions = practiceArea
    ? caseTypesByPracticeArea[practiceArea] ?? defaultCaseTypes
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
            <Dialog.Title color="fg" fontSize="17px" fontWeight="600" lineHeight="1.2">
              Add lead manually
            </Dialog.Title>
            <Dialog.Description mt="10px" color="fg.muted" fontSize="13px" lineHeight="1.35">
              For walk-ins, phone enquiries, or referrals that came directly to the firm.
            </Dialog.Description>

            <VStack align="stretch" gap="12px" mt="18px">
              <Grid templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }} gap="10px">
                <FormField label="First name">
                  <Input placeholder="e.g. Sandra" {...fieldStyles} />
                </FormField>
                <FormField label="Last name">
                  <Input placeholder="e.g. Osei" {...fieldStyles} />
                </FormField>
              </Grid>

              <FormField label="Email address">
                <Input type="email" placeholder="e.g. sandra@example.com" {...fieldStyles} />
              </FormField>

              <FormField label="Phone number">
                <Input type="tel" placeholder="e.g. +1 (555) 012-3456" {...fieldStyles} />
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
                    {practiceArea ? "Select case type" : "Select practice area first"}
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

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Text as="label" display="block" mb="5px" color="fg" fontSize="11px" fontWeight="500">
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
  _focus: { borderColor: "brand.solid", boxShadow: "0 0 0 1px var(--brand-cta)" },
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
  _focus: { borderColor: "brand.solid", boxShadow: "0 0 0 1px var(--brand-cta)" },
};
