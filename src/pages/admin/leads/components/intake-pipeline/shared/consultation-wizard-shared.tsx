import {
  Box,
  Flex,
  Grid,
  HStack,
  Input,
  Stack,
  Switch,
  Text,
  Textarea,
  chakra,
} from "@chakra-ui/react";
import { CalendarClock, Check, Info, Phone, Video, X, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { memo, useMemo, useState } from "react";
import type { Lead } from "@/api/leads";
import type { ConsultationLocation } from "@/api/consultation-settings";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FormSelect } from "@/components/ui/form-select";
import type { StaffMemberDTO } from "@/hooks/use-staff-list";
import {
  BrandButton,
  MutedText,
  OutlineButton,
} from "@/components/ui/intake-ui";

// Shared building blocks for the consultation wizards (the scheduling wizard in
// consultation-view.tsx and the instant-consultation wizard). Extracted
// verbatim so both dialogs stay visually and behaviourally identical.
// Non-component exports live in consultation-wizard-constants.ts.

import {
  CONSULTATION_TYPE_OPTIONS,
  DURATION_PRESETS,
  fieldStyles,
  invalidColor,
  type ConsultationMode,
  type DurationChoice,
} from "./consultation-wizard-constants";

export function StepProgress({ step, total }: { step: number; total: number }) {
  return (
    <Box
      mt="14px"
      h="3px"
      borderRadius="999px"
      bg="border.subtle"
      overflow="hidden"
    >
      <Box
        h="full"
        bg="brand.solid"
        w={`${(step / total) * 100}%`}
        transition="width 0.2s ease"
      />
    </Box>
  );
}

export function SelectClientStep({
  leads,
  selectedLeadId,
  matterType,
  language,
  touched,
  onSelect,
}: {
  leads: Lead[];
  selectedLeadId: string;
  matterType: string;
  language: string;
  touched: boolean;
  onSelect: (leadId: string) => void;
}) {
  return (
    <Stack gap="14px" pt="8px">
      <HStack
        align="flex-start"
        gap="10px"
        p="12px"
        border="1px solid"
        borderColor="#7c3cff"
        borderRadius="7px"
        bg="#f4ebff"
        color="#4b00b8"
        fontSize="11px"
        lineHeight="1.4"
      >
        <Info size={13} />
        <Box>
          Leads who have cleared conflict check are shown — including those
          still completing the questionnaire. A consultation can be booked
          before the questionnaire is finished.
        </Box>
      </HStack>

      <Box>
        <Text m="0 0 8px" color="fg" fontSize="12px" fontWeight="500">
          Select lead
        </Text>
        {leads.length === 0 ? (
          <MutedText>No leads are ready for a consultation.</MutedText>
        ) : (
          <SearchableSelect
            ariaLabel="Select lead"
            value={selectedLeadId}
            onChange={onSelect}
            invalid={touched}
            placeholder="— Select a conflict-cleared lead —"
            searchPlaceholder="Search by name or email…"
            emptyText="No leads match your search"
            options={leads.map((lead) => ({
              value: lead.id,
              label: lead.name,
              sublabel: lead.email,
            }))}
          />
        )}
      </Box>

      {selectedLeadId ? (
        <Grid
          templateColumns={{ base: "1fr", sm: "repeat(2, minmax(0, 1fr))" }}
          gap="10px"
        >
          <ReadOnlyField label="Matter type">{matterType}</ReadOnlyField>
          <ReadOnlyField label="Language">{language}</ReadOnlyField>
        </Grid>
      ) : null}
    </Stack>
  );
}

export function StepFieldLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <Text m="0 0 8px" color="fg" fontSize="13px" fontWeight="600">
      {children}
      {required ? <chakra.span color="#d14343"> *</chakra.span> : null}
    </Text>
  );
}

export function CheckOption({
  checked,
  disabled,
  label,
  onToggle,
}: {
  checked: boolean;
  disabled?: boolean;
  label: ReactNode;
  onToggle: () => void;
}) {
  return (
    <chakra.button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      display="flex"
      alignItems="center"
      gap="8px"
      opacity={disabled ? 0.5 : 1}
      cursor={disabled ? "not-allowed" : "pointer"}
    >
      <Box
        w="16px"
        h="16px"
        borderRadius="4px"
        border="1px solid"
        borderColor={checked ? "brand.solid" : "border"}
        bg={checked ? "brand.solid" : "bg"}
        color="brand.fg"
        display="grid"
        placeItems="center"
      >
        {checked ? <Check size={12} /> : null}
      </Box>
      <Text m="0" fontSize="13px" color="fg">
        {label}
      </Text>
    </chakra.button>
  );
}

// Note shown in place of mode-specific fields that our backend handles
// automatically (video Meet link, phone number).
export function ModeNote({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <HStack
      gap="8px"
      p="10px 12px"
      border="1px solid"
      borderColor="border"
      borderRadius="8px"
      bg="bg.subtle"
      color="fg.muted"
      fontSize="12px"
      lineHeight="1.4"
    >
      {icon}
      <Text m="0">{children}</Text>
    </HStack>
  );
}

export function ScheduleDetailsStep({
  durationChoice,
  customDuration,
  consultationType,
  attorneyId,
  attorneys,
  allStaff,
  participantIds,
  locationId,
  locations,
  defaultNotes,
  notifyEmail,
  urgent,
  hideUrgent,
  touchedField,
  onUrgentChange,
  onDurationChoiceChange,
  onCustomDurationChange,
  onConsultationTypeChange,
  onAttorneyChange,
  onParticipantsChange,
  onLocationChange,
  onCreateLocation,
  creatingLocation,
  onNotesChange,
  onNotifyEmailChange,
}: {
  durationChoice: DurationChoice;
  customDuration: string;
  consultationType: ConsultationMode;
  attorneyId: string;
  attorneys: StaffMemberDTO[];
  allStaff: StaffMemberDTO[];
  participantIds: string[];
  locationId: string;
  locations: ConsultationLocation[];
  defaultNotes: string;
  notifyEmail: boolean;
  urgent: boolean;
  // Instant consultations: urgency is implied, so the switch is hidden and a
  // "starts now" note takes its place.
  hideUrgent?: boolean;
  touchedField: "duration" | "attorney" | "location" | null;
  onUrgentChange: (value: boolean) => void;
  onDurationChoiceChange: (value: DurationChoice) => void;
  onCustomDurationChange: (value: string) => void;
  onConsultationTypeChange: (value: ConsultationMode) => void;
  onAttorneyChange: (value: string) => void;
  onParticipantsChange: (value: string[]) => void;
  onLocationChange: (value: string) => void;
  onCreateLocation: (label: string) => void;
  creatingLocation: boolean;
  onNotesChange: (value: string) => void;
  onNotifyEmailChange: (value: boolean) => void;
}) {
  const [addingLocation, setAddingLocation] = useState(false);
  const [newLocationLabel, setNewLocationLabel] = useState("");
  const [attendeeQuery, setAttendeeQuery] = useState("");

  // This step re-renders on every keystroke in the notes/duration fields, so the
  // dropdown option arrays are memoized: a fresh array would rebuild FormSelect's
  // list collection and re-render every Select.Item each character typed.
  const attorneyOptions = useMemo(
    () =>
      attorneys.map((attorney) => ({
        value: attorney.id,
        label: `${attorney.firstName} ${attorney.lastName}`.trim(),
      })),
    [attorneys],
  );
  const locationOptions = useMemo(
    () => locations.map((loc) => ({ value: loc.id, label: loc.label })),
    [locations],
  );

  const participantOptions = useMemo(
    () =>
      allStaff.filter(
        (s) =>
          s.id !== attorneyId &&
          (s.role === "attorney" || s.role === "paralegal"),
      ),
    [allStaff, attorneyId],
  );
  const addedParticipants = useMemo(
    () => participantOptions.filter((s) => participantIds.includes(s.id)),
    [participantOptions, participantIds],
  );
  const attendeeMatches = useMemo(() => {
    const query = attendeeQuery.trim().toLowerCase();
    if (!query) return [];
    return participantOptions.filter(
      (s) =>
        !participantIds.includes(s.id) &&
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(query),
    );
  }, [participantOptions, participantIds, attendeeQuery]);

  const addParticipant = (id: string) => {
    onParticipantsChange([...participantIds, id]);
    setAttendeeQuery("");
  };
  const removeParticipant = (id: string) =>
    onParticipantsChange(participantIds.filter((p) => p !== id));

  return (
    <Stack gap="16px" pt="12px">
      {/* Consultation type */}
      <Box>
        <StepFieldLabel required>Consultation type</StepFieldLabel>
        <HStack gap="8px" wrap="wrap">
          {CONSULTATION_TYPE_OPTIONS.map((option) => {
            const active = consultationType === option.value;
            return (
              <chakra.button
                key={option.value}
                type="button"
                onClick={() => onConsultationTypeChange(option.value)}
                px="16px"
                h="36px"
                borderRadius="999px"
                border="1px solid"
                fontSize="13px"
                fontWeight="500"
                bg={active ? "brand.subtle" : "bg"}
                color={active ? "brand.fg" : "fg.muted"}
                borderColor={active ? "brand.solid" : "border"}
              >
                {option.label}
              </chakra.button>
            );
          })}
        </HStack>
      </Box>

      {/* Mode-specific */}
      {consultationType === "video" ? (
        <Box>
          <StepFieldLabel>Video call link</StepFieldLabel>
          <ModeNote icon={<Video size={14} />}>
            A Google Meet link is generated automatically when the consultation
            is confirmed.
          </ModeNote>
        </Box>
      ) : consultationType === "phone_call" ? (
        <Box>
          <StepFieldLabel>Phone call</StepFieldLabel>
          <ModeNote icon={<Phone size={14} />}>
            The lead attorney's phone number will be used for this call.
          </ModeNote>
        </Box>
      ) : (
        <Box>
          <StepFieldLabel required>Office location</StepFieldLabel>
          {addingLocation ? (
            <Stack gap="8px">
              <Input
                value={newLocationLabel}
                onChange={(e) => setNewLocationLabel(e.currentTarget.value)}
                placeholder="Location name / address"
                {...fieldStyles}
              />
              <HStack gap="8px">
                <BrandButton
                  disabled={!newLocationLabel.trim() || creatingLocation}
                  onClick={() => {
                    onCreateLocation(newLocationLabel.trim());
                    setNewLocationLabel("");
                    setAddingLocation(false);
                  }}
                >
                  {creatingLocation ? "Saving…" : "Save location"}
                </BrandButton>
                <OutlineButton onClick={() => setAddingLocation(false)}>
                  Cancel
                </OutlineButton>
              </HStack>
            </Stack>
          ) : (
            <Stack gap="6px">
              <FormSelect
                ariaLabel="Office location"
                value={locationId}
                onChange={onLocationChange}
                invalid={touchedField === "location"}
                placeholder="Select office location"
                options={locationOptions}
              />
              <chakra.button
                type="button"
                onClick={() => setAddingLocation(true)}
                color="brand.fg"
                fontSize="12px"
                fontWeight="500"
                textAlign="left"
                w="fit-content"
              >
                + Add new location
              </chakra.button>
            </Stack>
          )}
        </Box>
      )}

      {/* Time — lead-driven by default; urgent is auto-scheduled ASAP; instant
          consultations start now (switch hidden, urgency implied) */}
      <Box>
        {hideUrgent ? (
          <>
            <StepFieldLabel>Timing</StepFieldLabel>
            <ModeNote icon={<Zap size={14} />}>
              This consultation starts now. If a fee applies and you choose
              "Pay now", it begins as soon as the client pays.
            </ModeNote>
          </>
        ) : (
          <>
            <Flex align="center" justify="space-between" mb="8px">
              <StepFieldLabel required>
                {urgent ? "Urgent scheduling" : "Available time slots"}
              </StepFieldLabel>
              <HStack gap="8px">
                <Text fontSize="12px" color="fg.muted">
                  Urgent — schedule now
                </Text>
                <Switch.Root
                  checked={urgent}
                  onCheckedChange={(e) => onUrgentChange(e.checked)}
                >
                  <Switch.HiddenInput />
                  <Switch.Control bg={urgent ? "brand.solid" : undefined}>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </HStack>
            </Flex>
            {urgent ? (
              <ModeNote icon={<CalendarClock size={14} />}>
                The lead skips the slot queue. The consultation is scheduled
                automatically for the earliest moment — if a fee applies, the
                time is set when they pay and confirmation follows immediately.
              </ModeNote>
            ) : (
              <ModeNote icon={<CalendarClock size={14} />}>
                The lead chooses a time from the selected attorney's
                availability — they'll receive a link to pick the slot that
                works for them.
              </ModeNote>
            )}
          </>
        )}
        <Box mt="12px">
          <StepFieldLabel>Consultation length</StepFieldLabel>
          <HStack gap="8px" wrap="wrap">
            {DURATION_PRESETS.map((preset) => (
              <ChoiceChip
                key={preset}
                active={durationChoice === preset}
                onClick={() => onDurationChoiceChange(preset)}
              >
                {preset} min
              </ChoiceChip>
            ))}
            <ChoiceChip
              active={durationChoice === "custom"}
              onClick={() => onDurationChoiceChange("custom")}
            >
              Custom
            </ChoiceChip>
          </HStack>
          {durationChoice === "custom" ? (
            <Input
              type="number"
              min={1}
              value={customDuration}
              onChange={(event) =>
                onCustomDurationChange(event.currentTarget.value)
              }
              placeholder="Minutes"
              mt="8px"
              {...fieldStyles}
              borderColor={touchedField === "duration" ? invalidColor : "border"}
            />
          ) : null}
        </Box>
      </Box>

      {/* Assigned attorney */}
      <Box>
        <StepFieldLabel required>Assigned attorney</StepFieldLabel>
        <FormSelect
          ariaLabel="Assigned attorney"
          value={attorneyId}
          onChange={onAttorneyChange}
          invalid={touchedField === "attorney"}
          placeholder="Select attorney"
          options={attorneyOptions}
        />
      </Box>

      {/* Additional attendees — search to add */}
      <Box>
        <StepFieldLabel>
          Additional attendees{" "}
          <chakra.span color="fg.muted" fontWeight="400">
            (optional)
          </chakra.span>
        </StepFieldLabel>
        <Text m="0 0 8px" fontSize="12px" color="fg.muted">
          Add paralegals or staff who need to attend.
        </Text>
        {addedParticipants.length > 0 ? (
          <HStack gap="6px" wrap="wrap" mb="8px">
            {addedParticipants.map((member) => (
              <HStack
                key={member.id}
                gap="6px"
                px="10px"
                h="28px"
                borderRadius="999px"
                bg="bg.subtle"
                border="1px solid"
                borderColor="border"
                fontSize="12px"
              >
                <Text m="0">
                  {`${member.firstName} ${member.lastName}`.trim()}
                </Text>
                <chakra.button
                  type="button"
                  onClick={() => removeParticipant(member.id)}
                  color="fg.muted"
                  aria-label="Remove attendee"
                  display="grid"
                  placeItems="center"
                >
                  <X size={12} />
                </chakra.button>
              </HStack>
            ))}
          </HStack>
        ) : null}
        <Box position="relative">
          <Input
            value={attendeeQuery}
            onChange={(e) => setAttendeeQuery(e.currentTarget.value)}
            placeholder="Search staff to add…"
            {...fieldStyles}
          />
          {attendeeMatches.length > 0 ? (
            <Stack
              gap="0"
              position="absolute"
              zIndex={10}
              top="calc(100% + 4px)"
              left="0"
              right="0"
              bg="bg"
              border="1px solid"
              borderColor="border"
              borderRadius="8px"
              boxShadow="0 8px 24px rgba(0, 0, 0, 0.12)"
              maxH="184px"
              overflowY="auto"
              p="4px"
            >
              {attendeeMatches.map((member) => (
                <chakra.button
                  key={member.id}
                  type="button"
                  onClick={() => addParticipant(member.id)}
                  textAlign="left"
                  px="10px"
                  py="8px"
                  borderRadius="6px"
                  fontSize="13px"
                  _hover={{ bg: "bg.subtle" }}
                >
                  {`${member.firstName} ${member.lastName}`.trim()}
                  {member.role ? (
                    <chakra.span color="fg.muted"> · {member.role}</chakra.span>
                  ) : null}
                </chakra.button>
              ))}
            </Stack>
          ) : null}
        </Box>
      </Box>

      {/* Pre-consultation notes */}
      <Box>
        <StepFieldLabel>
          Pre-consultation notes{" "}
          <chakra.span color="fg.muted" fontWeight="400">
            (optional — attorney only)
          </chakra.span>
        </StepFieldLabel>
        <NotesField defaultValue={defaultNotes} onChange={onNotesChange} />
      </Box>

      {/* Notify */}
      <Box>
        <StepFieldLabel>Notify client via</StepFieldLabel>
        <HStack gap="24px">
          <CheckOption
            checked={notifyEmail}
            label="Email"
            onToggle={() => onNotifyEmailChange(!notifyEmail)}
          />
          <CheckOption
            checked={false}
            disabled
            onToggle={() => undefined}
            label={
              <>
                SMS{" "}
                <chakra.span color="fg.subtle">(coming soon)</chakra.span>
              </>
            }
          />
        </HStack>
      </Box>
    </Stack>
  );
}

/**
 * The notes textarea keeps its own value and only writes through to the form.
 * Both wizards subscribe to their form fields at the dialog level, so a
 * controlled textarea re-rendered the entire dialog and step on every keystroke.
 * Nothing else on this step reads notes, and the field has no validation, so
 * the form is a write-only destination here — it's re-seeded from the form on
 * mount, which is all a step you can navigate away from and back to needs.
 */
const NotesField = memo(function NotesField({
  defaultValue,
  onChange,
}: {
  defaultValue: string;
  onChange: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <Textarea
      value={value}
      onChange={(event) => {
        const next = event.currentTarget.value;
        setValue(next);
        onChange(next);
      }}
      minH="92px"
      resize="vertical"
      placeholder="Add any notes for the attorney before the consultation."
      {...fieldStyles}
      h="auto"
      py="10px"
    />
  );
});

export function ChoiceChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <chakra.button
      type="button"
      minH="32px"
      px="14px"
      border="1px solid"
      borderColor={active ? "brand.solid" : "border"}
      borderRadius="8px"
      bg={active ? "brand.solid" : "bg"}
      color={active ? "brand.fg" : "fg.muted"}
      fontSize="12px"
      fontWeight="500"
      onClick={onClick}
    >
      {children}
    </chakra.button>
  );
}

export function ReadOnlyField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Text
        m="0 0 5px"
        color="fg.muted"
        fontSize="10px"
        fontWeight="600"
        textTransform="uppercase"
      >
        {label}
      </Text>
      <Box
        minH="28px"
        px="10px"
        py="7px"
        borderRadius="6px"
        bg="bg.subtle"
        color="fg.muted"
        fontSize="12px"
        lineHeight="1.1"
      >
        {children}
      </Box>
    </Box>
  );
}

export function SummaryItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box
      py="7px"
      borderBottom="1px solid"
      borderColor="border.subtle"
      _last={{ borderBottom: 0 }}
    >
      <Text
        m="0 0 4px"
        color="fg.muted"
        fontSize="10px"
        fontWeight="600"
        textTransform="uppercase"
      >
        {label}
      </Text>
      <Text m="0" color="fg" fontSize="13px" lineHeight="1.2">
        {children}
      </Text>
    </Box>
  );
}

