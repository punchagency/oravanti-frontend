import {
  Box,
  HStack,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import {
  CalendarDays,
  Check,
  ClipboardCheck,
  Download,
  ExternalLink,
  Lock,
  MapPin,
  Send,
  Video,
  X,
} from "lucide-react";
import { consultations } from "../data";
import type { ReactNode } from "react";
import {
  BrandButton,
  CardTitle,
  MutedText,
  OutlineButton,
  StatusPill,
  SurfaceCard,
} from "./intake-ui";

export function ConsultationView() {
  return (
    <Stack gap="16px" pt="24px" aria-label="Consultation and notes">
      <HStack justify="space-between" gap="16px" wrap="wrap">
        <MutedText fontSize="14px">2 consultations in progress</MutedText>
        <OutlineButton>
          <CalendarDays size={14} />
          Schedule consultation
        </OutlineButton>
      </HStack>

      <Stack gap="16px">
        {consultations.map((consultation) => (
          <SurfaceCard key={consultation.name}>
            <HStack align="center" justify="space-between" gap="16px" wrap="wrap">
              <PersonHeader
                initials={consultation.initials}
                avatarTone={consultation.avatarTone}
                title={consultation.name}
                subtitle={consultation.matter}
              />
              <HStack gap="8px" wrap="wrap" color="fg.muted" fontSize="12px" justify="flex-end">
                <StatusPill tone={consultation.statusTone}>{consultation.status}</StatusPill>
                <HStack
                  as="span"
                  gap="4px"
                  minH="18px"
                  px="8px"
                  py="2px"
                  borderRadius="999px"
                  bg="bg.subtle"
                  color="fg.muted"
                  fontSize="10px"
                  fontWeight="500"
                  lineHeight="1"
                >
                  {consultation.mode === "Video call" ? (
                    <Video size={11} />
                  ) : (
                    <MapPin size={11} />
                  )}
                  <Box as="span">{consultation.mode}</Box>
                </HStack>
                <Box as="span">{consultation.date}</Box>
              </HStack>
            </HStack>

            <HStack
              align="center"
              justify="space-between"
              gap="16px"
              wrap="wrap"
              mt="16px"
              pt="14px"
              pb="16px"
              borderTop="1px solid"
              borderBottom="1px solid"
              borderColor="border.subtle"
            >
              <HStack gap="12px">
                <RoundIcon>
                  <ClipboardCheck size={15} />
                </RoundIcon>
                <Box>
                  <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                    Questionnaire completed
                  </Text>
                  <MutedText>{consultation.questionnaire}</MutedText>
                </Box>
              </HStack>
              <LinkButton>View responses</LinkButton>
            </HStack>

            <Box py="16px" borderBottom="1px solid" borderColor="border.subtle">
              <HStack justify="space-between" gap="16px" wrap="wrap">
                <HStack gap="10px">
                  <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                    Documents
                  </Text>
                  <MutedText>{consultation.documentsReceived}</MutedText>
                </HStack>
                <LinkButton>Request missing</LinkButton>
              </HStack>

              <GroupLabel>Uploaded by client</GroupLabel>
              <Stack gap="0">
                {consultation.uploadedDocuments.map((document) => (
                  <DocumentRow
                    key={document.title}
                    title={document.title}
                    meta={document.meta}
                    received
                    downloadable
                    checkedTone="success"
                  />
                ))}
              </Stack>

              <GroupLabel>Required — pending receipt</GroupLabel>
              <Stack gap="0">
                {consultation.requiredDocuments.map((document) => (
                  <DocumentRow
                    key={document.title}
                    title={document.title}
                    meta="Required"
                    received={document.received}
                    checkedTone="warning"
                  />
                ))}
              </Stack>
              <MutedText>
                Check the box to manually confirm receipt of documents provided outside the
                client portal (e.g. in-person, by email, or via scan).
              </MutedText>
            </Box>

            <Stack gap="8px" py="16px" borderBottom="1px solid" borderColor="border.subtle">
              <Box>
                <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                  Attorney notes
                </Text>
                <MutedText>Notes are internal and not visible to the client.</MutedText>
              </Box>
              <Textarea
                aria-label={`${consultation.name} attorney notes`}
                defaultValue={consultation.notes}
                minH="102px"
                p="12px"
                borderColor="border"
                bg="bg"
                resize="vertical"
              />
              <OutlineButton alignSelf="flex-end">Save notes</OutlineButton>
            </Stack>

            <HStack justify="space-between" gap="16px" wrap="wrap" pt="16px">
              <HStack gap="6px" color="fg.muted" fontSize="12px">
                <Box
                  display="grid"
                  placeItems="center"
                  w="24px"
                  h="24px"
                  borderRadius="full"
                  bg="bg.subtle"
                  color="fg.muted"
                  fontSize="10px"
                  fontWeight="500"
                >
                  {consultation.assigneeInitials}
                </Box>
                <Box as="span" color="fg.muted">{consultation.assignee}</Box>
                <Box as="span">(Assigned)</Box>
              </HStack>
              <HStack gap="8px" wrap="wrap" justify="flex-end">
                <BrandButton>
                  <Send size={14} />
                  Proceed to fee agreement
                </BrandButton>
                <OutlineButton>
                  <CalendarDays size={14} />
                  Schedule follow-up
                </OutlineButton>
                <OutlineButton>
                  <X size={14} />
                  Close — no case
                </OutlineButton>
                <OutlineButton>
                  <ExternalLink size={14} />
                  Refer elsewhere
                </OutlineButton>
              </HStack>
            </HStack>
          </SurfaceCard>
        ))}
      </Stack>
    </Stack>
  );
}

function PersonHeader({
  initials,
  avatarTone,
  title,
  subtitle,
}: {
  initials: string;
  avatarTone: string;
  title: string;
  subtitle: string;
}) {
  return (
    <HStack gap="12px" minW="0">
      <Box
        display="grid"
        placeItems="center"
        flex="0 0 auto"
        w="34px"
        h="34px"
        borderRadius="full"
        bg={avatarTone === "blue" ? "#e5efff" : "#d9f8ed"}
        color={avatarTone === "blue" ? "#1c55b8" : "#00785a"}
        fontSize="11px"
        fontWeight="500"
      >
        {initials}
      </Box>
      <Box>
        <CardTitle>{title}</CardTitle>
        <MutedText>{subtitle}</MutedText>
      </Box>
    </HStack>
  );
}

function RoundIcon({ children }: { children: ReactNode }) {
  return (
    <Box
      display="grid"
      placeItems="center"
      flex="0 0 auto"
      w="32px"
      h="32px"
      borderRadius="full"
      bg="#d9f8ed"
      color="#00785a"
    >
      {children}
    </Box>
  );
}

function GroupLabel({ children }: { children: ReactNode }) {
  return (
    <Text
      mt="14px"
      mb="6px"
      color="fg.muted"
      fontSize="10px"
      fontWeight="500"
      lineHeight="1"
      textTransform="uppercase"
    >
      {children}
    </Text>
  );
}

function LinkButton({ children }: { children: ReactNode }) {
  return (
    <Box
      as="button"
      border="0"
      bg="transparent"
      color="brand.600"
      fontSize="12px"
      fontWeight="500"
    >
      {children}
    </Box>
  );
}

function DocumentRow({
  title,
  meta,
  received,
  downloadable = false,
  checkedTone,
}: {
  title: string;
  meta: string;
  received: boolean;
  downloadable?: boolean;
  checkedTone: "success" | "warning";
}) {
  return (
    <Box
      display="grid"
      gridTemplateColumns={{ base: "auto minmax(0, 1fr) auto", md: "auto minmax(0, 1fr) auto auto" }}
      alignItems="center"
      gap="10px"
      minH="50px"
      py={{ base: "9px", md: "0" }}
      borderBottom="1px solid"
      borderColor="border.subtle"
    >
      <Box
        display="grid"
        placeItems="center"
        w="16px"
        h="16px"
        border="1px solid"
        borderColor={received ? "transparent" : "border"}
        borderRadius="4px"
        bg={received ? (checkedTone === "success" ? "accent.attorney" : "brand.solid") : "bg"}
        color={received && checkedTone === "warning" ? "brand.fg" : "#ffffff"}
      >
        {received ? <Check size={11} /> : null}
      </Box>
      <Box>
        <Text m="0" color="fg" fontSize="13px" fontWeight="500" lineHeight="1.15">
          {title}
        </Text>
        <HStack gap="4px" color="fg.muted" fontSize="12px">
          <Box as="span">{meta}</Box>
          {meta === "Required" ? <Lock size={10} /> : null}
        </HStack>
      </Box>
      <StatusPill tone={received ? "success" : "warning"}>
        {received ? "Received" : "Pending"}
      </StatusPill>
      {downloadable ? (
        <Box
          as="button"
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          w="26px"
          h="26px"
          border="0"
          bg="transparent"
          color="fg.muted"
          aria-label={`Download ${title}`}
        >
          <Download size={14} />
        </Box>
      ) : null}
    </Box>
  );
}
