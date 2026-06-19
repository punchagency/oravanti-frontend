import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { leadSources } from "@/pages/admin/intake/data";
import { sourceValues, type LeadSource } from "@/api/leads";
import { useCreateLead } from "@/hooks/use-leads";
import { usePublicPracticeAreas } from "@/hooks/use-public-practice-areas";
import type { PublicPracticeArea } from "@/pages/contractor-sign-up/types";
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

function getCaseTypes(
  practiceAreaId: string,
  practiceAreas: PublicPracticeArea[] | undefined,
): { id: string; name: string }[] {
  if (!practiceAreaId || !practiceAreas) return [];
  const area = practiceAreas.find((a) => a.id === practiceAreaId);
  return area ? area.subcategories.flatMap((s) => s.caseTypes) : [];
}

export function AddLeadDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [practiceAreaId, setPracticeAreaId] = useState("");
  const [caseTypeId, setCaseTypeId] = useState("");
  const [source, setSource] = useState("Direct");
  const [situationSummary, setSituationSummary] = useState("");
  const [adversePartyName, setAdversePartyName] = useState("");
  const [adversePartyEmail, setAdversePartyEmail] = useState("");

  const { data: practiceAreas } = usePublicPracticeAreas();
  const createLead = useCreateLead();

  const caseTypeOptions = getCaseTypes(practiceAreaId, practiceAreas);

  function resetForm() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setPracticeAreaId("");
    setCaseTypeId("");
    setSource("Direct");
    setSituationSummary("");
    setAdversePartyName("");
    setAdversePartyEmail("");
  }

  function handleClose() {
    onOpenChange(false);
    resetForm();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
    createLead.mutate(
      {
        name,
        email,
        phone: phone || undefined,
        practiceAreaId: practiceAreaId || undefined,
        caseTypeId: caseTypeId || undefined,
        source: (sourceValues[source] ?? "direct") as LeadSource,
        situationSummary: situationSummary || undefined,
        intakeAdversePartyName: adversePartyName.trim() || undefined,
        intakeAdversePartyEmail: adversePartyEmail.trim() || undefined,
      },
      { onSuccess: () => handleClose() },
    );
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => {
        if (!details.open) handleClose();
        else onOpenChange(true);
      }}
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
            onClick={handleClose}
          >
            <X size={16} />
          </chakra.button>

          <Box as="form" p="32px 24px 24px" onSubmit={handleSubmit}>
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
                  <Input
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.currentTarget.value)}
                    placeholder="e.g. Sandra"
                    {...fieldStyles}
                  />
                </FormField>
                <FormField label="Last name">
                  <Input
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.currentTarget.value)}
                    placeholder="e.g. Osei"
                    {...fieldStyles}
                  />
                </FormField>
              </Grid>

              <FormField label="Email address">
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.currentTarget.value)}
                  placeholder="e.g. sandra@example.com"
                  {...fieldStyles}
                />
              </FormField>

              <FormField label="Phone number">
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.currentTarget.value)}
                  placeholder="e.g. +1 (555) 012-3456"
                  {...fieldStyles}
                />
              </FormField>

              <FormField label="Practice area interest">
                <chakra.select
                  value={practiceAreaId}
                  onChange={(event) => {
                    setPracticeAreaId(event.currentTarget.value);
                    setCaseTypeId("");
                  }}
                  {...selectStyles}
                >
                  <option value="">Select practice area</option>
                  {(practiceAreas ?? []).map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </chakra.select>
              </FormField>

              <FormField label="Case type">
                <chakra.select
                  {...selectStyles}
                  value={caseTypeId}
                  onChange={(event) => setCaseTypeId(event.currentTarget.value)}
                  disabled={!practiceAreaId}
                  opacity={practiceAreaId ? 1 : 0.62}
                  cursor={practiceAreaId ? "pointer" : "not-allowed"}
                >
                  <option value="">
                    {practiceAreaId
                      ? "Select case type"
                      : "Select practice area first"}
                  </option>
                  {caseTypeOptions.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name}
                    </option>
                  ))}
                </chakra.select>
              </FormField>

              <FormField label="Source">
                <chakra.select
                  value={source}
                  onChange={(e) => setSource(e.currentTarget.value)}
                  {...selectStyles}
                >
                  {leadSources.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </chakra.select>
              </FormField>

              <FormField label="Situation summary">
                <Textarea
                  value={situationSummary}
                  onChange={(e) => setSituationSummary(e.currentTarget.value)}
                  minH="70px"
                  resize="vertical"
                  placeholder="Brief description of client's situation..."
                  {...fieldStyles}
                />
              </FormField>

              <Box pt="4px">
                <Text fontSize="11px" fontWeight="600" color="fg.muted" mb="4px">
                  Known opposing party (optional)
                </Text>
                <Text fontSize="12px" color="fg.muted" mb="10px" lineHeight="1.4">
                  Recording the opposing party now lets the conflict check flag issues before the intake proceeds.
                </Text>
                <Grid
                  templateColumns={{ base: "1fr" }}
                  gap="10px"
                >
                  <FormField label="Opposing party name">
                    <Input
                      type="text"
                      value={adversePartyName}
                      onChange={(e) => setAdversePartyName(e.currentTarget.value)}
                      placeholder="e.g. Acme Corp"
                      {...fieldStyles}
                    />
                  </FormField>
                  <FormField label="Opposing party email">
                    <Input
                      type="email"
                      value={adversePartyEmail}
                      onChange={(e) => setAdversePartyEmail(e.currentTarget.value)}
                      placeholder="e.g. legal@acme.com"
                      {...fieldStyles}
                    />
                  </FormField>
                </Grid>
              </Box>
            </VStack>

            <Flex justify="space-between" gap="12px" mt="18px">
              <OutlineButton type="button" onClick={handleClose}>
                Cancel
              </OutlineButton>
              <BrandButton type="submit" minW="152px" loading={createLead.isPending}>
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
