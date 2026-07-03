import {
  Box,
  Dialog,
  Flex,
  Grid,
  HStack,
  Input,
  Portal,
  Select,
  Stack,
  Switch,
  Text,
  Textarea,
  chakra,
  createListCollection,
} from "@chakra-ui/react";
import {
  AlertTriangle,
  CalendarClock,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  Info,
  Lock,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Scale,
  Search,
  Send,
  Trash2,
  UserX,
  Video,
  X,
} from "lucide-react";
import type { ChangeEvent, ReactNode } from "react";
import {
  Fragment,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type {
  Consultation,
  ConsultationListItem,
  ConsultationSort,
  ConsultationStatus,
  FeeAgreementPreview,
  GenerateFeeAgreementInput,
  Lead,
} from "@/api/leads";
import { buildFeeAgreementHtml } from "./fee-agreement-document";
import { toast } from "sonner";
import { formatReceivedDate } from "@/api/leads";
import { downloadResponseFile } from "@/api/questionnaires";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FormSelect } from "@/components/ui/form-select";
import { DateField } from "@/components/ui/date-field";
import { TimeField } from "@/components/ui/time-field";
import { useCanDownloadDocuments } from "@/hooks/use-can-download-documents";
import {
  useAdvanceLeadStage,
  useCancelConsultation,
  useConsultations,
  useInitiateConsultation,
  useFeeAgreementPreview,
  useGenerateFeeAgreement,
  useLeadById,
  useLeads,
  useMarkFeeAgreementReceived,
  useNudgeClient,
  useSendFeeAgreement,
  useUpdateConsultation,
  useUpdateLead,
} from "@/hooks/use-leads";
import {
  useLeadQuestionnaire,
  useRequestMissingDocuments,
  useResponseDetail,
  useUploadResponseFile,
} from "@/hooks/use-questionnaires";
import { useStaffList, type StaffMemberDTO } from "@/hooks/use-staff-list";
import {
  useConsultationLocations,
  useConsultationSettings,
  useCreateConsultationLocation,
} from "@/hooks/use-consultation-settings";
import type {
  ConsultationLocation,
  ConsultationSettings,
} from "@/api/consultation-settings";
import {
  BrandButton,
  CardTitle,
  IntakeListSkeleton,
  MutedText,
  OutlineButton,
  StatusPill,
  SurfaceCard,
} from "../../../../components/ui/intake-ui";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { QuestionnaireResponseDialog } from "./questionnaire-response-dialog";

type ScheduleStep = 1 | 2 | 3;
type ConsultationMode = "video" | "in_person" | "phone_call";

const STEP_META: Record<ScheduleStep, { title: string; label: string }> = {
  1: { title: "Schedule consultation", label: "Step 1 of 3 — Select lead" },
  2: {
    title: "Consultation details",
    label: "Step 2 of 3 — Consultation details",
  },
  3: { title: "Review & confirm", label: "Step 3 of 3 — Review & confirm" },
};

const CONSULTATION_TYPE_OPTIONS: { value: ConsultationMode; label: string }[] =
  [
    { value: "video", label: "Video call" },
    { value: "phone_call", label: "Phone call" },
    { value: "in_person", label: "In person" },
  ];

const DURATION_PRESETS = [30, 45, 60, 90] as const;
type DurationChoice = (typeof DURATION_PRESETS)[number] | "custom";

function consultationModeLabel(mode: ConsultationMode): string {
  return (
    CONSULTATION_TYPE_OPTIONS.find((o) => o.value === mode)?.label ??
    "Video call"
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatIsoTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function consultationModeIcon(mode: ConsultationMode | undefined) {
  if (mode === "video") return <Video size={12} />;
  if (mode === "phone_call") return <Phone size={12} />;
  return <MapPin size={12} />;
}

type StatusTone = "info" | "success" | "danger" | "warning" | "neutral";

const CONSULT_STATUS_LABEL: Record<ConsultationStatus, string> = {
  pending_payment: "Pending payment",
  awaiting_slot_selection: "Awaiting slot",
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

const CONSULT_STATUS_TONE: Record<ConsultationStatus, StatusTone> = {
  pending_payment: "warning",
  awaiting_slot_selection: "warning",
  scheduled: "info",
  in_progress: "warning",
  completed: "success",
  cancelled: "danger",
  no_show: "danger",
};

// Solid dot colour per tone (mirrors intakeColors text tones in intake-ui).
const TONE_DOT: Record<StatusTone, string> = {
  info: "#2f63c7",
  success: "#00785a",
  warning: "#8a641d",
  danger: "#b00020",
  neutral: "#94a3b8",
};

const STATUS_FILTER_OPTIONS: { label: string; value: string }[] = [
  { label: "All statuses", value: "all" },
  { label: "Pending payment", value: "pending_payment" },
  { label: "Awaiting slot", value: "awaiting_slot_selection" },
  { label: "Scheduled", value: "scheduled" },
  { label: "In progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "No show", value: "no_show" },
];

const SORT_OPTIONS: { label: string; value: ConsultationSort }[] = [
  { label: "Date: earliest first", value: "date_asc" },
  { label: "Date: latest first", value: "date_desc" },
  { label: "Client: A–Z", value: "client_asc" },
  { label: "Client: Z–A", value: "client_desc" },
];

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

function attorneyFullName(item: ConsultationListItem): string {
  const name = `${item.attorneyFirstName ?? ""} ${
    item.attorneyLastName ?? ""
  }`.trim();
  return name || "Unassigned";
}

type FollowUpRequest = {
  lead: ConsultationSummaryLead;
  attorneyId?: string | null;
  parentConsultationId: string;
};

// Lets a ConsultationCard (rendered deep in the collapsible list) open the
// scheduling wizard as a follow-up without prop-drilling through the list.
const ScheduleFollowUpContext = createContext<(req: FollowUpRequest) => void>(
  () => {},
);

type WizardPreset = {
  lead: ConsultationSummaryLead | null;
  attorneyId?: string | null;
  parentConsultationId?: string;
};

export function ConsultationView() {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [preset, setPreset] = useState<WizardPreset>({ lead: null });
  const { data, isLoading } = useLeads({ stage: "consultation" });
  const leads = Array.isArray(data) ? data : (data?.leads ?? []);

  const noConsultation = leads.filter((l) => !l.consultationId);
  const scheduled = leads.filter((l) => l.consultationId);

  function openWizard(lead: ConsultationSummaryLead | null) {
    setPreset({ lead });
    setScheduleOpen(true);
  }
  function openFollowUp(req: FollowUpRequest) {
    setPreset({
      lead: req.lead,
      attorneyId: req.attorneyId,
      parentConsultationId: req.parentConsultationId,
    });
    setScheduleOpen(true);
  }

  return (
    <ScheduleFollowUpContext.Provider value={openFollowUp}>
      <Stack gap="20px" pt="24px" aria-label="Consultation and notes">
        <HStack justify="space-between" gap="16px" wrap="wrap">
          <Text m="0" color="fg" fontSize="15px" fontWeight="500">
            {scheduled.length > 0
              ? `${scheduled.length} consultation${
                  scheduled.length === 1 ? "" : "s"
                } in progress`
              : "Consultation & notes"}
          </Text>
          <BrandButton onClick={() => openWizard(null)}>
            <CalendarDays size={14} />
            Schedule consultation
          </BrandButton>
        </HStack>

        {isLoading ? (
          <IntakeListSkeleton />
        ) : leads.length === 0 ? (
          <MutedText>No leads in the consultation stage.</MutedText>
        ) : (
          <Stack gap="32px">
            {noConsultation.length > 0 ? (
              <Stack gap="12px">
                <MutedText fontSize="14px">
                  {noConsultation.length} lead
                  {noConsultation.length === 1 ? "" : "s"} with no consultation
                  in progress
                </MutedText>
                <Stack gap="10px">
                  {noConsultation.map((lead) => (
                    <CollapsibleNoConsultation
                      key={lead.id}
                      lead={lead}
                      onSchedule={() => openWizard(lead)}
                    />
                  ))}
                </Stack>
              </Stack>
            ) : null}

            {noConsultation.length > 0 && scheduled.length > 0 ? (
              <Box
                borderTop="1px solid"
                borderColor="border"
                mt="4px"
                pt="8px"
              />
            ) : null}

            {scheduled.length > 0 ? (
              <ConsultationList leads={scheduled} />
            ) : null}
          </Stack>
        )}
      </Stack>

      <ScheduleConsultationDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        presetLead={preset.lead}
        presetAttorneyId={preset.attorneyId}
        parentConsultationId={preset.parentConsultationId}
      />
    </ScheduleFollowUpContext.Provider>
  );
}

type ConsultationSummaryLead = Pick<Lead, "id" | "name" | "caseTypeName">;

type ConsultationRow = {
  lead: ConsultationSummaryLead;
  summary: ConsultationListItem;
};

// The consultation list: search / status / attorney / sort / pagination over
// the consultation-stage leads, enriched with a batch summary fetch so each
// collapsed row can show status, attorney and time without a per-card detail
// request. Controls are applied client-side against that summary set.
function ConsultationList({ leads }: { leads: Lead[] }) {
  const { data, isLoading } = useConsultations({ limit: 200 });

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [attorney, setAttorney] = useState("all");
  const [sort, setSort] = useState<ConsultationSort>("date_asc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Keyed by consultation id (a lead can now have several consultations —
  // follow-ups, cancelled ones) so each row shows the lead's *current* one.
  const summaryByConsultation = useMemo(() => {
    const map = new Map<string, ConsultationListItem>();
    for (const item of data?.data ?? []) map.set(item.id, item);
    return map;
  }, [data]);

  // Only the leads currently in the consultation stage, paired with their
  // current consultation's summary (dropping any whose summary hasn't loaded
  // yet, or whose consultation was detached, e.g. after a cancellation).
  const rows = useMemo<ConsultationRow[]>(() => {
    return leads.flatMap((lead) => {
      const summary = lead.consultationId
        ? summaryByConsultation.get(lead.consultationId)
        : undefined;
      return summary ? [{ lead, summary }] : [];
    });
  }, [leads, summaryByConsultation]);

  const attorneyOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const { summary } of rows) {
      if (summary.leadAttorneyId && !seen.has(summary.leadAttorneyId)) {
        seen.set(summary.leadAttorneyId, attorneyFullName(summary));
      }
    }
    return [
      { label: "All attorneys", value: "all" },
      ...[...seen.entries()].map(([value, label]) => ({ label, value })),
    ];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter(({ lead, summary }) => {
      if (q && !lead.name.toLowerCase().includes(q)) return false;
      if (status !== "all" && summary.status !== status) return false;
      if (attorney !== "all" && summary.leadAttorneyId !== attorney)
        return false;
      return true;
    });
    const time = (r: ConsultationRow) =>
      r.summary.scheduledAt ? new Date(r.summary.scheduledAt).getTime() : null;
    list.sort((a, b) => {
      switch (sort) {
        case "client_asc":
          return a.lead.name.localeCompare(b.lead.name);
        case "client_desc":
          return b.lead.name.localeCompare(a.lead.name);
        case "date_desc":
        case "date_asc":
        default: {
          const ta = time(a);
          const tb = time(b);
          // Unscheduled consultations sort to the bottom either way.
          if (ta === null && tb === null) return 0;
          if (ta === null) return 1;
          if (tb === null) return -1;
          return sort === "date_desc" ? tb - ta : ta - tb;
        }
      }
    });
    return list;
  }, [rows, query, status, attorney, sort]);

  const total = filtered.length;
  const pageStart = (page - 1) * limit;
  const paged = filtered.slice(pageStart, pageStart + limit);

  function resetPage<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <Stack gap="14px">
      <Flex align="center" justify="space-between" gap="12px" wrap="wrap">
        <HStack gap="10px">
          <HStack
            gap="8px"
            h="34px"
            minW="240px"
            px="12px"
            border="1px solid"
            borderColor="border"
            borderRadius="7px"
            bg="bg"
            color="fg.muted"
          >
            <Search size={15} />
            <Input
              aria-label="Search consultations"
              placeholder="Search consultations..."
              type="search"
              value={query}
              onChange={(e) => resetPage(setQuery)(e.target.value)}
              p="0"
              h="auto"
              border="0"
              bg="transparent"
              color="fg"
              _focus={{ boxShadow: "none", outline: "0" }}
            />
          </HStack>
          <FilterSelect
            ariaLabel="Filter by status"
            value={status}
            onChange={resetPage(setStatus)}
            options={STATUS_FILTER_OPTIONS}
          />
          <FilterSelect
            ariaLabel="Filter by attorney"
            value={attorney}
            onChange={resetPage(setAttorney)}
            options={attorneyOptions}
          />
          <FilterSelect
            ariaLabel="Sort consultations"
            value={sort}
            onChange={resetPage((v: string) => setSort(v as ConsultationSort))}
            options={SORT_OPTIONS}
          />
        </HStack>
        <MutedText fontSize="11px">
          {isLoading
            ? "Loading…"
            : `${total} of ${rows.length} consultation${
                rows.length === 1 ? "" : "s"
              }`}
        </MutedText>
      </Flex>

      {isLoading ? (
        <IntakeListSkeleton />
      ) : total === 0 ? (
        <MutedText>No consultations match your filters.</MutedText>
      ) : (
        <Stack gap="10px">
          {paged.map(({ lead, summary }) => (
            <CollapsibleConsultation
              key={summary.id}
              lead={lead}
              summary={summary}
            />
          ))}
        </Stack>
      )}

      {total > limit ? (
        <PaginationControls
          total={total}
          currentPage={page}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={resetPage(setLimit)}
          pageSizeOptions={[...PAGE_SIZE_OPTIONS]}
        />
      ) : null}
    </Stack>
  );
}

// A consultation rendered as a collapsible row: the summary bar is always
// visible; expanding reveals the full consultation detail card.
function CollapsibleConsultation({
  lead,
  summary,
}: {
  lead: ConsultationSummaryLead;
  summary: ConsultationListItem;
}) {
  const [open, setOpen] = useState(false);
  const tone = CONSULT_STATUS_TONE[summary.status];
  const dateLabel = summary.scheduledAt
    ? `${formatReceivedDate(summary.scheduledAt)}, ${formatIsoTime(
        summary.scheduledAt,
      )}`
    : "Not scheduled yet";

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      overflow="hidden"
    >
      <chakra.button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap="16px"
        w="full"
        textAlign="left"
        px="18px"
        py="14px"
        bg={open ? "bg.subtle" : "bg"}
        _hover={{ bg: "bg.subtle" }}
      >
        <HStack gap="12px" minW="0" align="flex-start">
          <Box
            flex="0 0 auto"
            mt="6px"
            w="8px"
            h="8px"
            borderRadius="full"
            bg={TONE_DOT[tone]}
          />
          <Box minW="0">
            <HStack gap="8px" minW="0" wrap="wrap">
              <Text
                m="0"
                color="fg"
                fontSize="14px"
                fontWeight="600"
                truncate
              >
                {lead.name}
              </Text>
              <MutedText>{lead.caseTypeName ?? "Matter type not set"}</MutedText>
            </HStack>
            <MutedText>
              {dateLabel} · {attorneyFullName(summary)}
            </MutedText>
          </Box>
        </HStack>
        <HStack gap="10px" flex="0 0 auto">
          <StatusPill tone={tone}>
            {CONSULT_STATUS_LABEL[summary.status]}
          </StatusPill>
          <Box color="fg.muted">
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </Box>
        </HStack>
      </chakra.button>

      {open ? (
        <Box borderTop="1px solid" borderColor="border">
          <ConsultationCard lead={lead} bare />
        </Box>
      ) : null}
    </Box>
  );
}

// Collapsible row for a lead that has no active consultation yet — expands to
// the same card (with its "Schedule consultation" action).
function CollapsibleNoConsultation({
  lead,
  onSchedule,
}: {
  lead: Lead;
  onSchedule: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      overflow="hidden"
    >
      <chakra.button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap="16px"
        w="full"
        textAlign="left"
        px="18px"
        py="14px"
        bg={open ? "bg.subtle" : "bg"}
        _hover={{ bg: "bg.subtle" }}
      >
        <HStack gap="12px" minW="0" align="flex-start">
          <Box
            flex="0 0 auto"
            mt="6px"
            w="8px"
            h="8px"
            borderRadius="full"
            bg={TONE_DOT.warning}
          />
          <Box minW="0">
            <HStack gap="8px" minW="0" wrap="wrap">
              <Text m="0" color="fg" fontSize="14px" fontWeight="600" truncate>
                {lead.name}
              </Text>
              <MutedText>{lead.caseTypeName ?? "Matter type not set"}</MutedText>
            </HStack>
            <MutedText>No consultation scheduled yet</MutedText>
          </Box>
        </HStack>
        <HStack gap="10px" flex="0 0 auto">
          <StatusPill tone="warning" icon={<CalendarClock size={11} />}>
            No consultation
          </StatusPill>
          <Box color="fg.muted">
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </Box>
        </HStack>
      </chakra.button>

      {open ? (
        <Box borderTop="1px solid" borderColor="border">
          <ConsultationCard lead={lead} bare onSchedule={onSchedule} />
        </Box>
      ) : null}
    </Box>
  );
}

function FilterSelect({
  ariaLabel,
  value,
  onChange,
  options,
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly { label: string; value: string }[];
}) {
  const collection = useMemo(
    () => createListCollection({ items: [...options] }),
    [options],
  );

  return (
    <Select.Root
      collection={collection}
      size="sm"
      minW="164px"
      value={[value]}
      onValueChange={(event) => onChange(event.value[0] ?? value)}
      aria-label={ariaLabel}
    >
      <Select.HiddenSelect />
      <Select.Control>
        <Select.Trigger bg="bg" borderColor="border" rounded="7px">
          <Select.ValueText />
        </Select.Trigger>
        <Select.IndicatorGroup>
          <Select.Indicator />
        </Select.IndicatorGroup>
      </Select.Control>
      <Portal>
        <Select.Positioner>
          <Select.Content>
            {collection.items.map((item) => (
              <Select.Item item={item} key={item.value}>
                <Select.ItemText>{item.label}</Select.ItemText>
                <Select.ItemIndicator />
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Portal>
    </Select.Root>
  );
}

function ConsultationCard({
  lead,
  onSchedule,
  bare = false,
}: {
  lead: ConsultationSummaryLead;
  onSchedule?: () => void;
  bare?: boolean;
}) {
  const { data: leadDetail } = useLeadById(lead.id);
  const { data: questionnaire } = useLeadQuestionnaire(lead.id);
  const responseId = questionnaire?.response?.id ?? null;
  const { data: responseDetail } = useResponseDetail(responseId);
  const canDownload = useCanDownloadDocuments();
  const { data: staffData } = useStaffList({
    role: "attorney",
    status: "active",
  });

  const saveNotesMutation = useUpdateConsultation();
  const saveLeadNotes = useUpdateLead();
  const completeMutation = useUpdateConsultation();
  const noShowMutation = useUpdateConsultation();
  const outcomesMutation = useUpdateConsultation();
  const cancelMutation = useCancelConsultation();
  const openFollowUp = useContext(ScheduleFollowUpContext);
  const generateFee = useGenerateFeeAgreement();
  const sendFee = useSendFeeAgreement();
  const markReceived = useMarkFeeAgreementReceived();
  const nudgeClient = useNudgeClient();
  const advanceStage = useAdvanceLeadStage();
  const requestMissing = useRequestMissingDocuments();

  const consultation = leadDetail?.consultation;
  const consultationHistory = leadDetail?.consultationHistory ?? [];
  const hasConsultation = Boolean(consultation);
  const feeAgreement = leadDetail?.feeAgreement;
  const send = questionnaire?.send;
  const response = questionnaire?.response;
  const { data: firmFeeSettings } = useConsultationSettings();

  // Fee-agreement preview modal. `generatedPreview` holds the doc returned by a
  // fresh generate; reopening a draft fetches it by id instead.
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generatedPreview, setGeneratedPreview] =
    useState<FeeAgreementPreview | null>(null);
  const draftPreview = useFeeAgreementPreview(
    feeAgreement?.id ?? null,
    previewOpen && !generatedPreview,
  );
  const previewData = generatedPreview ?? draftPreview.data ?? null;
  function closePreview() {
    setPreviewOpen(false);
    setGeneratedPreview(null);
  }

  const [notes, setNotes] = useState<string | null>(null);
  const [now, setTime] = useState(() => Date.now());
  const baseNotes = hasConsultation
    ? (consultation?.attorneyNotes ?? "")
    : (leadDetail?.notes ?? "");
  const displayNotes = notes !== null ? notes : baseNotes;
  const [docDialog, setDocDialog] = useState<{
    id: string;
    tab: "responses" | "documents";
  } | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const attorneys = staffData?.data ?? [];
  const attorneyName = (() => {
    if (!consultation?.leadAttorneyId) return "Unassigned";
    const a = attorneys.find((s) => s.id === consultation.leadAttorneyId);
    return a ? `${a.firstName} ${a.lastName}`.trim() : "Assigned attorney";
  })();

  const modeLabel = consultation
    ? consultationModeLabel(consultation.mode)
    : null;
  const consultationDate = consultation?.scheduledAt
    ? formatReceivedDate(consultation.scheduledAt)
    : "—";
  const consultationTime = consultation?.scheduledAt
    ? formatIsoTime(consultation.scheduledAt)
    : "—";
  const consultStatusLabel = consultation
    ? CONSULT_STATUS_LABEL[consultation.status]
    : null;
  const consultStatusTone: StatusTone = consultation
    ? CONSULT_STATUS_TONE[consultation.status]
    : "neutral";

  // A consultation can be marked complete once it exists, hasn't already been
  // completed/cancelled, and its scheduled start time has passed.
  const consultationCompleted = consultation?.status === "completed";
  // The fee agreement unlocks once the lead has completed *any* consultation —
  // a later follow-up being cancelled (which detaches the current consultation)
  // must not hide it again.
  const hasCompletedConsultation =
    consultationCompleted ||
    consultationHistory.some((c) => c.status === "completed");
  const isCompletable =
    consultation?.status === "scheduled" ||
    consultation?.status === "in_progress";
  const scheduledAt = consultation?.scheduledAt;
  const startTimeReached = scheduledAt
    ? now >= new Date(scheduledAt).getTime()
    : false;
  const canComplete = isCompletable && startTimeReached;

  // A consultation can be cancelled at any pre-terminal stage.
  const canCancel =
    consultation?.status === "pending_payment" ||
    consultation?.status === "awaiting_slot_selection" ||
    consultation?.status === "scheduled" ||
    consultation?.status === "in_progress";

  // ── Documents ──────────────────────────────────────────────────────────────
  // Staff can manually attach a document received outside the client portal.
  const uploadFile = useUploadResponseFile();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingQidRef = useRef<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  function handlePickDocument(questionId: string) {
    pendingQidRef.current = questionId;
    fileInputRef.current?.click();
  }
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    const questionId = pendingQidRef.current;
    e.currentTarget.value = "";
    pendingQidRef.current = null;
    if (!file || !questionId || !responseId) return;
    setUploadingId(questionId);
    uploadFile.mutate(
      { responseId, questionId, file },
      { onSettled: () => setUploadingId(null) },
    );
  }

  const sections = responseDetail?.send?.schemaSnapshot?.sections ?? [];
  const fileQuestions = sections.flatMap((s) =>
    (s.questions ?? []).filter((q) => q.type === "file_upload"),
  );
  const labelByQuestionId = new Map(fileQuestions.map((q) => [q.id, q.label]));
  const files = responseDetail?.files ?? [];
  const uploadedQuestionIds = new Set(files.map((f) => f.questionId));
  const totalDocs = fileQuestions.length;
  const receivedCount = fileQuestions.filter((q) =>
    uploadedQuestionIds.has(q.id),
  ).length;
  const pendingQuestions = fileQuestions.filter(
    (q) => !uploadedQuestionIds.has(q.id),
  );
  const issueFiles = files.filter((f) => f.scanStatus === "issues_found");
  const issueCount = issueFiles.reduce(
    (n, f) => n + (f.scanResult?.length ?? 0),
    0,
  );

  // ── Questionnaire status ─────────────────────────────────────────────────────
  const questionnaireComplete =
    response?.status === "submitted" || send?.status === "submitted";
  const submittedDate = response?.submittedAt
    ? formatReceivedDate(response.submittedAt)
    : null;

  // ── Fee agreement tracker ────────────────────────────────────────────────────
  const caseOpened = Boolean(leadDetail?.convertedCaseId);
  const feeStageIndex = caseOpened
    ? 4
    : feeAgreement?.status === "signed"
      ? 3
      : feeAgreement?.status === "pending_signature"
        ? 2
        : feeAgreement?.status === "draft"
          ? 1
          : 0;
  const feeStatus: {
    label: string;
    tone: "success" | "warning" | "neutral" | "gold";
  } = caseOpened
    ? { label: "Signed & received", tone: "success" }
    : feeAgreement?.status === "signed"
      ? { label: "Signed", tone: "success" }
      : feeAgreement?.status === "pending_signature"
        ? { label: "Sent", tone: "warning" }
        : feeAgreement?.status === "draft"
          ? { label: "Generated", tone: "gold" }
          : { label: "Not started", tone: "neutral" };

  const alreadySettled =
    consultation?.outcome === "close_no_case" ||
    consultation?.outcome === "refer_elsewhere";

  function handleSaveNotes() {
    if (hasConsultation) {
      saveNotesMutation.mutate(
        { id: lead.id, data: { attorneyNotes: displayNotes } },
        { onSuccess: () => setNotes(null) },
      );
    } else {
      saveLeadNotes.mutate(
        { id: lead.id, data: { notes: displayNotes } },
        { onSuccess: () => setNotes(null) },
      );
    }
  }
  function handleCompleteConsultation() {
    completeMutation.mutate({ id: lead.id, data: { status: "completed" } });
  }
  function handleNoShow() {
    noShowMutation.mutate({ id: lead.id, data: { status: "no_show" } });
  }
  function handleFollowUp() {
    if (!consultation) return;
    // Record the outcome on the completed parent, then open the wizard to book
    // the follow-up (admin can choose urgent or lead-driven).
    outcomesMutation.mutate({ id: lead.id, data: { outcome: "follow_up" } });
    openFollowUp({
      lead,
      attorneyId: consultation.leadAttorneyId,
      parentConsultationId: consultation.id,
    });
  }
  function handleCloseNoCase() {
    outcomesMutation.mutate({
      id: lead.id,
      data: { outcome: "close_no_case" },
    });
  }
  function handleReferElsewhere() {
    outcomesMutation.mutate({
      id: lead.id,
      data: { outcome: "refer_elsewhere" },
    });
  }
  function handleCancelConsultation() {
    cancelMutation.mutate(
      { id: lead.id, reason: cancelReason.trim() || undefined },
      {
        onSuccess: () => {
          setCancelOpen(false);
          setCancelReason("");
        },
      },
    );
  }

  const Container = bare ? BareCardBody : SurfaceCard;

  return (
    <Container>
      {/* 1. Lead + consultation details */}
      <HStack align="flex-start" justify="space-between" gap="16px" wrap="wrap">
        <HStack gap="12px" minW="0" align="flex-start">
          <Avatar name={lead.name} />
          <Box minW="0">
            <CardTitle>{lead.name}</CardTitle>
            <MutedText>{lead.caseTypeName ?? "Matter type not set"}</MutedText>
          </Box>
        </HStack>
        {consultation ? (
          <HStack gap="10px" wrap="wrap" justify="flex-end" align="center">
            <StatusPill tone={consultStatusTone}>
              {consultStatusLabel}
            </StatusPill>
            <StatusPill
              tone="neutral"
              icon={consultationModeIcon(consultation.mode)}
            >
              {modeLabel}
            </StatusPill>
            <MutedText>
              {consultationDate} · {consultationTime} · {consultation.duration}{" "}
              min
            </MutedText>
            {canCancel ? (
              <chakra.button
                type="button"
                onClick={() => setCancelOpen(true)}
                display="inline-flex"
                alignItems="center"
                gap="4px"
                fontSize="12px"
                fontWeight="500"
                color="#b00020"
                _hover={{ textDecoration: "underline" }}
              >
                <X size={12} />
                Cancel
              </chakra.button>
            ) : null}
          </HStack>
        ) : (
          <HStack gap="8px" align="center">
            <StatusPill tone="warning" icon={<CalendarClock size={11} />}>
              No consultation scheduled
            </StatusPill>
            {onSchedule ? (
              <BrandButton onClick={onSchedule}>
                <CalendarDays size={14} />
                Schedule consultation
              </BrandButton>
            ) : null}
          </HStack>
        )}
      </HStack>

      {/* 2. Questionnaire row */}
      <SectionRow>
        <HStack justify="space-between" gap="12px" wrap="wrap">
          <HStack gap="12px" minW="0" align="flex-start">
            <IconSquare>
              <ClipboardCheck size={17} />
            </IconSquare>
            <Box minW="0">
              <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                {questionnaireComplete
                  ? "Questionnaire completed"
                  : "Awaiting response"}
              </Text>
              <MutedText>
                {submittedDate ? `Submitted ${submittedDate} · ` : ""}
                {titleCase(send?.language ?? "English")}
              </MutedText>
            </Box>
          </HStack>
          {responseId ? (
            <TextLink
              onClick={() => setDocDialog({ id: responseId, tab: "responses" })}
            >
              View responses
            </TextLink>
          ) : null}
        </HStack>
      </SectionRow>

      {/* 3. Documents */}
      <SectionRow>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <Stack gap="12px">
          {/* Documents only exist once the lead has a questionnaire response. */}
          {responseId ? (
            <>
              <HStack justify="space-between" gap="12px" wrap="wrap">
                <HStack gap="8px">
                  <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                    Documents
                  </Text>
                  <MutedText>
                    {receivedCount} of {totalDocs} received
                  </MutedText>
                </HStack>
                <TextLink
                  loading={requestMissing.isPending}
                  disabled={!send || pendingQuestions.length === 0}
                  onClick={() => send && requestMissing.mutate(send.id)}
                >
                  Request missing
                </TextLink>
              </HStack>

              {files.length > 0 ? (
                <Box>
                  <SubLabel>Uploaded by client</SubLabel>
                  <Stack gap="0">
                    {files.map((file) => (
                      <HStack
                        key={file.id}
                        justify="space-between"
                        gap="10px"
                        py="10px"
                        borderBottom="1px solid"
                        borderColor="border.subtle"
                        _last={{ borderBottom: 0 }}
                      >
                        <HStack gap="10px" minW="0">
                          <CheckMarker checked tone="green" />
                          <Box minW="0">
                            <Text
                              m="0"
                              color="fg"
                              fontSize="13px"
                              fontWeight="500"
                              truncate
                              title={
                                labelByQuestionId.get(file.questionId) ??
                                file.originalFilename
                              }
                            >
                              {labelByQuestionId.get(file.questionId) ??
                                file.originalFilename}
                            </Text>
                            <MutedText>
                              {file.originalFilename} ·{" "}
                              {formatBytes(file.fileSize)}
                            </MutedText>
                          </Box>
                        </HStack>
                        <HStack gap="8px" flex="0 0 auto">
                          <StatusPill tone="success">Received</StatusPill>
                          {canDownload ? (
                            <chakra.button
                              type="button"
                              aria-label={`Download ${file.originalFilename}`}
                              display="grid"
                              placeItems="center"
                              w="26px"
                              h="26px"
                              color="fg.muted"
                              onClick={() =>
                                void downloadResponseFile(
                                  file.id,
                                  file.originalFilename,
                                )
                              }
                            >
                              <Download size={15} />
                            </chakra.button>
                          ) : null}
                        </HStack>
                      </HStack>
                    ))}
                  </Stack>
                </Box>
              ) : null}

              {pendingQuestions.length > 0 ? (
                <Box>
                  <SubLabel>Required — pending receipt</SubLabel>
                  <Stack gap="0">
                    {pendingQuestions.map((q) => {
                      const isUploading = uploadingId === q.id;
                      return (
                        <HStack
                          key={q.id}
                          justify="space-between"
                          gap="10px"
                          py="10px"
                          borderBottom="1px solid"
                          borderColor="border.subtle"
                          _last={{ borderBottom: 0 }}
                        >
                          <HStack gap="10px" minW="0">
                            <CheckMarker
                              checked={false}
                              tone="gold"
                              onClick={
                                isUploading
                                  ? undefined
                                  : () => handlePickDocument(q.id)
                              }
                              label={`Upload ${q.label} received outside the portal`}
                            />
                            <Box minW="0">
                              <Text
                                m="0"
                                color="fg"
                                fontSize="13px"
                                fontWeight="500"
                                truncate
                                title={q.label}
                              >
                                {q.label}
                              </Text>
                              <HStack gap="4px" color="fg.muted">
                                <MutedText>Required</MutedText>
                                <Lock size={10} />
                              </HStack>
                            </Box>
                          </HStack>
                          <StatusPill
                            tone={isUploading ? "neutral" : "warning"}
                          >
                            {isUploading ? "Uploading…" : "Pending"}
                          </StatusPill>
                        </HStack>
                      );
                    })}
                  </Stack>
                  <HStack gap="6px" mt="8px" color="fg.muted">
                    <Info size={12} />
                    <MutedText>
                      Click the box next to a document to upload one received
                      outside the client portal (e.g. in-person, by email, or
                      via scan).
                    </MutedText>
                  </HStack>
                </Box>
              ) : null}

              {issueFiles.length > 0 && responseId ? (
                <HStack
                  justify="space-between"
                  gap="12px"
                  wrap="wrap"
                  p="10px 14px"
                  borderRadius="8px"
                  bg="#ffe2e4"
                >
                  <HStack gap="10px" minW="0" wrap="wrap">
                    <HStack gap="6px" color="fg.muted">
                      <Scale size={14} />
                      <Text
                        m="0"
                        fontSize="10px"
                        fontWeight="600"
                        textTransform="uppercase"
                      >
                        Document review
                      </Text>
                    </HStack>
                    <HStack gap="6px" color="#b00020">
                      <AlertTriangle size={14} />
                      <Text m="0" fontSize="12px" fontWeight="500">
                        {issueCount} issue{issueCount === 1 ? "" : "s"} detected
                        — review required
                      </Text>
                    </HStack>
                  </HStack>
                  <OutlineButton
                    onClick={() =>
                      setDocDialog({ id: responseId, tab: "documents" })
                    }
                  >
                    View details
                  </OutlineButton>
                </HStack>
              ) : null}
            </>
          ) : null}

          <Box>
            <Text m="0" color="fg" fontSize="13px" fontWeight="500">
              Attorney notes
            </Text>
            <MutedText>
              {hasConsultation
                ? "Notes are internal and not visible to the client."
                : "Capture observations before the consultation — saved to the lead and internal only."}
            </MutedText>
            <Textarea
              aria-label={`${lead.name} attorney notes`}
              value={displayNotes}
              onChange={(e) => setNotes(e.currentTarget.value)}
              mt="8px"
              minH="96px"
              p="12px"
              borderColor="border"
              bg="bg"
              resize="vertical"
              placeholder="Record consultation notes, client statements, key facts, and your preliminary assessment here. These notes are saved to the matter record and referenced in the fee agreement stage."
            />
            <Flex justify="flex-end" mt="8px">
              <OutlineButton
                loading={saveNotesMutation.isPending || saveLeadNotes.isPending}
                onClick={handleSaveNotes}
              >
                Save notes
              </OutlineButton>
            </Flex>
          </Box>
        </Stack>
      </SectionRow>

      {/* 4. Fee agreement — unlocks once any consultation has been completed */}
      {hasCompletedConsultation ? (
        <SectionRow>
          <Stack gap="14px">
            <HStack justify="space-between" gap="12px" wrap="wrap">
              <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                Fee agreement
              </Text>
              <StatusPill tone={feeStatus.tone}>{feeStatus.label}</StatusPill>
            </HStack>
            <FeeAgreementTracker activeIndex={feeStageIndex} />
            {caseOpened ? (
              <HStack gap="6px" color="#00785a">
                <Check size={14} />
                <Text m="0" fontSize="12px" fontWeight="500">
                  Signed &amp; received — case opened successfully
                </Text>
              </HStack>
            ) : !feeAgreement ? (
              <FeeAgreementForm
                consultationFeeAmount={firmFeeSettings?.defaultAmount ?? null}
                generating={generateFee.isPending}
                onSubmit={(data) =>
                  generateFee.mutate(
                    { id: lead.id, data },
                    {
                      onSuccess: (preview) => {
                        setGeneratedPreview(preview);
                        setPreviewOpen(true);
                      },
                    },
                  )
                }
              />
            ) : feeAgreement.status === "draft" ? (
              <Stack gap="10px">
                <MutedText>Agreement generated — ready to dispatch.</MutedText>
                <HStack gap="8px" wrap="wrap">
                  <BrandButton onClick={() => setPreviewOpen(true)}>
                    <FileText size={14} />
                    Preview &amp; send
                  </BrandButton>
                </HStack>
              </Stack>
            ) : feeAgreement.status === "pending_signature" ? (
              <Stack gap="10px">
                <MutedText>
                  Signing link sent — awaiting client signature.
                </MutedText>
                <HStack gap="8px" wrap="wrap">
                  <BrandButton
                    loading={markReceived.isPending}
                    onClick={() => markReceived.mutate(feeAgreement.id)}
                  >
                    <Check size={14} />
                    Mark as received
                  </BrandButton>
                  <OutlineButton
                    loading={nudgeClient.isPending}
                    onClick={() => nudgeClient.mutate(feeAgreement.id)}
                  >
                    <Mail size={14} />
                    Nudge client
                  </OutlineButton>
                </HStack>
              </Stack>
            ) : feeAgreement.status === "signed" ? (
              <Stack gap="10px">
                <MutedText>Signed document received.</MutedText>
                <HStack gap="8px" wrap="wrap">
                  <BrandButton
                    loading={advanceStage.isPending}
                    onClick={() =>
                      advanceStage.mutate({
                        id: lead.id,
                        stage: "case_opening",
                      })
                    }
                  >
                    <ExternalLink size={14} />
                    Advance to case opening
                  </BrandButton>
                </HStack>
              </Stack>
            ) : null}
          </Stack>
        </SectionRow>
      ) : (
        <SectionRow>
          <Stack gap="12px">
            <HStack justify="space-between" gap="12px" wrap="wrap">
              <Text m="0" color="fg" fontSize="13px" fontWeight="500">
                Fee agreement
              </Text>
              <StatusPill tone="neutral" icon={<Lock size={11} />}>
                Locked
              </StatusPill>
            </HStack>
            <HStack gap="6px" color="fg.muted" align="flex-start">
              <Info size={12} />
              <MutedText>
                {hasConsultation
                  ? "The fee agreement unlocks once the consultation has been completed."
                  : "The fee agreement unlocks once a consultation has been scheduled and completed."}
              </MutedText>
            </HStack>
            {isCompletable ? (
              <Box>
                <HStack gap="8px" wrap="wrap">
                  <BrandButton
                    disabled={!canComplete}
                    loading={completeMutation.isPending}
                    onClick={handleCompleteConsultation}
                  >
                    <Check size={14} />
                    Mark consultation completed
                  </BrandButton>
                  <OutlineButton
                    disabled={!canComplete}
                    loading={noShowMutation.isPending}
                    onClick={handleNoShow}
                  >
                    <UserX size={14} />
                    Mark no-show
                  </OutlineButton>
                </HStack>
                {!canComplete ? (
                  <Box mt="6px">
                    <MutedText>
                      Available after the scheduled start time (
                      {consultationDate} · {consultationTime}).
                    </MutedText>
                  </Box>
                ) : null}
              </Box>
            ) : null}
          </Stack>
        </SectionRow>
      )}

      {/* Past consultations (follow-ups / re-schedules) */}
      {consultationHistory.length > 0 ? (
        <SectionRow>
          <PastConsultations items={consultationHistory} />
        </SectionRow>
      ) : null}

      {/* 5. Footer — outcomes are recorded against a consultation */}
      {hasConsultation ? (
        <HStack
          justify="space-between"
          gap="12px"
          wrap="wrap"
          mt="16px"
          pt="14px"
          borderTop="1px solid"
          borderColor="border.subtle"
        >
          <HStack gap="8px" color="fg.muted" fontSize="12px">
            <Avatar name={attorneyName} size={28} />
            <Box as="span" fontWeight="500" color="fg">
              {attorneyName}
            </Box>
            <Box as="span">(Assigned)</Box>
          </HStack>
          {alreadySettled ? (
            <MutedText fontSize="12px">
              {consultation?.outcome === "close_no_case"
                ? "Closed — no case opened."
                : "Referred to outside counsel."}
            </MutedText>
          ) : (
            <HStack gap="8px" wrap="wrap" justify="flex-end">
              {consultationCompleted ? (
                <OutlineButton
                  loading={outcomesMutation.isPending}
                  onClick={handleFollowUp}
                >
                  <CalendarDays size={14} />
                  Schedule follow-up
                </OutlineButton>
              ) : null}
              <OutlineButton
                loading={outcomesMutation.isPending}
                onClick={handleCloseNoCase}
              >
                <X size={14} />
                Close — no case
              </OutlineButton>
              <OutlineButton
                loading={outcomesMutation.isPending}
                onClick={handleReferElsewhere}
              >
                <ExternalLink size={14} />
                Refer elsewhere
              </OutlineButton>
            </HStack>
          )}
        </HStack>
      ) : null}

      <QuestionnaireResponseDialog
        responseId={docDialog?.id ?? null}
        initialTab={docDialog?.tab ?? "responses"}
        onClose={() => setDocDialog(null)}
      />

      <CancelConsultationDialog
        open={cancelOpen}
        leadName={lead.name}
        reason={cancelReason}
        onReasonChange={setCancelReason}
        loading={cancelMutation.isPending}
        onConfirm={handleCancelConsultation}
        onClose={() => {
          setCancelOpen(false);
          setCancelReason("");
        }}
      />

      <FeeAgreementPreviewModal
        open={previewOpen}
        loading={draftPreview.isLoading && !generatedPreview}
        preview={previewData}
        sending={sendFee.isPending}
        onSend={() =>
          previewData &&
          sendFee.mutate(previewData.agreement.id, { onSuccess: closePreview })
        }
        onClose={closePreview}
      />
    </Container>
  );
}

function CancelConsultationDialog({
  open,
  leadName,
  reason,
  onReasonChange,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  leadName: string;
  reason: string;
  onReasonChange: (value: string) => void;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(d) => {
        if (!d.open) onClose();
      }}
    >
      <Dialog.Backdrop bg="blackAlpha.500" />
      <Dialog.Positioner>
        <Dialog.Content
          maxW="440px"
          borderRadius="14px"
          bg="bg"
          p="0"
          overflow="hidden"
        >
          <Box p="20px 24px">
            <Dialog.Title color="fg" fontSize="16px" fontWeight="600">
              Cancel consultation
            </Dialog.Title>
            <MutedText fontSize="13px">
              This cancels {leadName}'s consultation, revokes their booking link,
              and notifies everyone involved. This can't be undone, but you can
              schedule a new consultation afterwards.
            </MutedText>
            <Box mt="14px">
              <Text m="0 0 6px" fontSize="12px" color="fg.muted">
                Reason (optional)
              </Text>
              <Textarea
                value={reason}
                onChange={(e) => onReasonChange(e.currentTarget.value)}
                placeholder="Shared with the client and staff in the cancellation email."
                minH="72px"
                resize="vertical"
                {...fieldStyles}
                h="auto"
                py="10px"
              />
            </Box>
          </Box>
          <Flex
            justify="flex-end"
            gap="10px"
            p="14px 24px"
            borderTop="1px solid"
            borderColor="border.subtle"
          >
            <OutlineButton onClick={onClose} disabled={loading}>
              Keep consultation
            </OutlineButton>
            <BrandButton
              onClick={onConfirm}
              loading={loading}
              bg="#b00020"
              color="white"
              _hover={{ bg: "#970019" }}
            >
              <X size={14} />
              Cancel consultation
            </BrandButton>
          </Flex>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

// ── Fee agreement form + preview ──────────────────────────────────────────────

const feeFormSchema = z
  .object({
    attorneyFeeType: z.enum(["flat", "hourly", "flat_hourly"]),
    flatRate: z.string(),
    hourlyRate: z.string(),
    governmentFees: z.array(
      z.object({ name: z.string(), amount: z.string() }),
    ),
    paymentPlan: z.enum(["pay_in_full", "two_payments", "installments"]),
    applyConsultationCredit: z.boolean(),
    operating: z.string(),
    trust: z.string(),
  })
  .superRefine((val, ctx) => {
    if (
      (val.attorneyFeeType === "flat" || val.attorneyFeeType === "flat_hourly") &&
      !val.flatRate.trim()
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["flatRate"],
        message: "Enter the flat rate",
      });
    if (
      (val.attorneyFeeType === "hourly" ||
        val.attorneyFeeType === "flat_hourly") &&
      !val.hourlyRate.trim()
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hourlyRate"],
        message: "Enter the hourly rate",
      });
    val.governmentFees.forEach((g, i) => {
      if (!g.name.trim())
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["governmentFees", i, "name"],
          message: "Name required",
        });
      if (!g.amount.trim())
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["governmentFees", i, "amount"],
          message: "Amount required",
        });
    });
  });

type FeeForm = z.infer<typeof feeFormSchema>;

const FEE_TYPE_OPTIONS: { value: FeeForm["attorneyFeeType"]; label: string }[] = [
  { value: "flat", label: "Flat fee" },
  { value: "hourly", label: "Hourly" },
  { value: "flat_hourly", label: "Flat + hourly" },
];
const PAYMENT_PLAN_OPTIONS: { value: FeeForm["paymentPlan"]; label: string }[] = [
  { value: "pay_in_full", label: "Pay in full" },
  { value: "two_payments", label: "2 payments" },
  { value: "installments", label: "Instalment" },
];

function FeeFieldLabel({ children }: { children: ReactNode }) {
  return (
    <Text
      m="0 0 8px"
      fontSize="11px"
      fontWeight="600"
      letterSpacing="0.04em"
      textTransform="uppercase"
      color="fg.muted"
    >
      {children}
    </Text>
  );
}

export function FeeAgreementForm({
  consultationFeeAmount,
  generating,
  onSubmit,
}: {
  consultationFeeAmount: number | null;
  generating: boolean;
  onSubmit: (data: GenerateFeeAgreementInput) => void;
}) {
  const { control, register, handleSubmit, setValue } = useForm<FeeForm>({
    resolver: zodResolver(feeFormSchema),
    defaultValues: {
      attorneyFeeType: "flat",
      flatRate: "",
      hourlyRate: "",
      governmentFees: [{ name: "", amount: "" }],
      paymentPlan: "pay_in_full",
      applyConsultationCredit: false,
      operating: "",
      trust: "",
    },
    mode: "onChange",
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "governmentFees",
  });

  const attorneyFeeType = useWatch({ control, name: "attorneyFeeType" });
  const paymentPlan = useWatch({ control, name: "paymentPlan" });
  const applyCredit = useWatch({ control, name: "applyConsultationCredit" });
  const flatRate = useWatch({ control, name: "flatRate" });
  const govFees = useWatch({ control, name: "governmentFees" });
  const operatingField = useWatch({ control, name: "operating" });
  const trustField = useWatch({ control, name: "trust" });

  const attorneyTotal =
    attorneyFeeType === "hourly" ? 0 : Number(flatRate || 0);
  const govTotal = (govFees ?? []).reduce(
    (sum, g) => sum + Number(g?.amount || 0),
    0,
  );

  // Account split auto-fills from the fees until the admin edits a field.
  const [operatingTouched, setOperatingTouched] = useState(false);
  const [trustTouched, setTrustTouched] = useState(false);
  const operatingValue = operatingTouched
    ? operatingField
    : String(attorneyTotal);
  const trustValue = trustTouched ? trustField : String(govTotal);

  const onValid = (data: FeeForm) => {
    onSubmit({
      attorneyFee: {
        type: data.attorneyFeeType,
        flatRate:
          data.attorneyFeeType !== "hourly"
            ? Number(data.flatRate || 0)
            : undefined,
        hourlyRate:
          data.attorneyFeeType !== "flat"
            ? Number(data.hourlyRate || 0)
            : undefined,
      },
      governmentFees: data.governmentFees.map((g) => ({
        name: g.name.trim(),
        amount: Number(g.amount || 0),
      })),
      paymentPlan: data.paymentPlan,
      applyConsultationCredit: data.applyConsultationCredit,
      accountSplit: {
        operating: Number(operatingValue || 0),
        trust: Number(trustValue || 0),
      },
    });
  };

  return (
    <chakra.form onSubmit={handleSubmit(onValid)}>
      <Box p="16px" borderRadius="10px" bg="bg.subtle">
        <Stack gap="18px">
          {/* Attorney fees */}
          <Box>
            <FeeFieldLabel>Attorney fees</FeeFieldLabel>
            <HStack gap="8px" wrap="wrap" mb="10px">
              {FEE_TYPE_OPTIONS.map((o) => (
                <ChoiceChip
                  key={o.value}
                  active={attorneyFeeType === o.value}
                  onClick={() => setValue("attorneyFeeType", o.value)}
                >
                  {o.label}
                </ChoiceChip>
              ))}
            </HStack>
            <HStack gap="10px" wrap="wrap">
              {attorneyFeeType !== "hourly" ? (
                <HStack gap="6px">
                  <Text fontSize="14px" color="fg.muted">
                    $
                  </Text>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    maxW="120px"
                    {...fieldStyles}
                    {...register("flatRate")}
                  />
                  <MutedText>flat rate</MutedText>
                </HStack>
              ) : null}
              {attorneyFeeType !== "flat" ? (
                <HStack gap="6px">
                  <Text fontSize="14px" color="fg.muted">
                    $
                  </Text>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    maxW="120px"
                    {...fieldStyles}
                    {...register("hourlyRate")}
                  />
                  <MutedText>/ hour</MutedText>
                </HStack>
              ) : null}
            </HStack>
          </Box>

          {/* Government fees */}
          <Box>
            <FeeFieldLabel>Government fees</FeeFieldLabel>
            <Stack gap="8px">
              {fields.map((f, i) => (
                <HStack key={f.id} gap="8px">
                  <Input
                    placeholder="Fee name (e.g. USCIS filing fee)"
                    {...fieldStyles}
                    {...register(`governmentFees.${i}.name` as const)}
                  />
                  <HStack gap="4px" flex="0 0 auto">
                    <Text fontSize="14px" color="fg.muted">
                      $
                    </Text>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      maxW="110px"
                      textAlign="right"
                      {...fieldStyles}
                      {...register(`governmentFees.${i}.amount` as const)}
                    />
                  </HStack>
                  <chakra.button
                    type="button"
                    aria-label="Remove fee"
                    onClick={() => (fields.length > 1 ? remove(i) : undefined)}
                    display="grid"
                    placeItems="center"
                    w="32px"
                    h="32px"
                    flex="0 0 auto"
                    borderRadius="7px"
                    color="fg.muted"
                    opacity={fields.length > 1 ? 1 : 0.4}
                    _hover={{ bg: "bg.muted" }}
                  >
                    <Trash2 size={14} />
                  </chakra.button>
                </HStack>
              ))}
            </Stack>
            <chakra.button
              type="button"
              onClick={() => append({ name: "", amount: "" })}
              mt="8px"
              display="inline-flex"
              alignItems="center"
              gap="4px"
              fontSize="12px"
              fontWeight="500"
              color="fg.muted"
              border="1px solid"
              borderColor="border"
              borderRadius="7px"
              px="10px"
              h="30px"
              _hover={{ bg: "bg.muted" }}
            >
              <Plus size={13} />
              Add fee row
            </chakra.button>
          </Box>

          {/* Payment plan */}
          <Box>
            <FeeFieldLabel>Payment plan</FeeFieldLabel>
            <HStack gap="8px" wrap="wrap">
              {PAYMENT_PLAN_OPTIONS.map((o) => (
                <ChoiceChip
                  key={o.value}
                  active={paymentPlan === o.value}
                  onClick={() => setValue("paymentPlan", o.value)}
                >
                  {o.label}
                </ChoiceChip>
              ))}
            </HStack>
          </Box>

          {/* Apply consultation credit */}
          <CheckOption
            checked={applyCredit}
            onToggle={() => setValue("applyConsultationCredit", !applyCredit)}
            label={`Apply consultation fee${
              consultationFeeAmount != null
                ? ` ($${consultationFeeAmount})`
                : ""
            } as credit toward retainer`}
          />

          {/* Account split */}
          <Box>
            <FeeFieldLabel>Account split</FeeFieldLabel>
            <HStack gap="10px" wrap="wrap" align="flex-start">
              <Box flex="1" minW="180px">
                <MutedText>Operating</MutedText>
                <HStack gap="4px" mt="4px">
                  <Text fontSize="14px" color="fg.muted">
                    $
                  </Text>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={operatingValue}
                    {...fieldStyles}
                    onChange={(e) => {
                      setOperatingTouched(true);
                      setValue("operating", e.currentTarget.value);
                    }}
                  />
                </HStack>
              </Box>
              <Box flex="1" minW="180px">
                <MutedText>Trust (IOLTA)</MutedText>
                <HStack gap="4px" mt="4px">
                  <Text fontSize="14px" color="fg.muted">
                    $
                  </Text>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={trustValue}
                    {...fieldStyles}
                    onChange={(e) => {
                      setTrustTouched(true);
                      setValue("trust", e.currentTarget.value);
                    }}
                  />
                </HStack>
              </Box>
            </HStack>
          </Box>
        </Stack>
      </Box>

      <HStack mt="14px">
        <BrandButton type="submit" loading={generating}>
          <FileText size={14} />
          Generate fee agreement
        </BrandButton>
      </HStack>
    </chakra.form>
  );
}

export function FeeAgreementPreviewModal({
  open,
  loading,
  preview,
  sending,
  onSend,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  preview: FeeAgreementPreview | null;
  sending: boolean;
  onSend: () => void;
  onClose: () => void;
}) {
  function handleDownload() {
    if (!preview) return;
    const win = window.open("", "_blank", "width=820,height=1000");
    if (!win) return;
    win.document.write(
      `<html><head><title>Fee agreement ${preview.document.docRef}</title></head><body style="margin:24px;">${buildFeeAgreementHtml(
        preview.document,
      )}</body></html>`,
    );
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(d) => {
        if (!d.open) onClose();
      }}
      placement="center"
      lazyMount
      unmountOnExit
    >
      <Dialog.Backdrop bg="rgba(0,0,0,0.46)" />
      <Dialog.Positioner>
        <Dialog.Content
          maxW="760px"
          w="calc(100vw - 48px)"
          maxH="calc(100vh - 72px)"
          borderRadius="14px"
          bg="bg"
          p="0"
          overflow="hidden"
          display="flex"
          flexDirection="column"
        >
          <Flex
            align="center"
            justify="space-between"
            gap="12px"
            p="14px 18px"
            borderBottom="1px solid"
            borderColor="border.subtle"
            flex="0 0 auto"
          >
            <Dialog.Title color="fg" fontSize="15px" fontWeight="600">
              Fee agreement preview
            </Dialog.Title>
            <HStack gap="8px">
              <OutlineButton disabled title="Coming soon">
                <Pencil size={14} />
                Edit
              </OutlineButton>
              <OutlineButton disabled={!preview} onClick={handleDownload}>
                <Download size={14} />
                Download
              </OutlineButton>
              <BrandButton
                disabled={!preview}
                loading={sending}
                onClick={onSend}
              >
                <Send size={14} />
                Send to client
              </BrandButton>
              <chakra.button
                type="button"
                aria-label="Close preview"
                onClick={onClose}
                display="grid"
                placeItems="center"
                w="32px"
                h="32px"
                borderRadius="full"
                color="fg.muted"
                _hover={{ bg: "bg.muted" }}
              >
                <X size={16} />
              </chakra.button>
            </HStack>
          </Flex>

          <Box flex="1" overflowY="auto" p="24px" bg="bg.subtle">
            {loading || !preview ? (
              <MutedText>Loading preview…</MutedText>
            ) : (
              <Box
                bg="bg"
                borderRadius="10px"
                p="28px"
                border="1px solid"
                borderColor="border"
                dangerouslySetInnerHTML={{
                  __html: buildFeeAgreementHtml(preview.document),
                }}
              />
            )}
          </Box>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

// Collapsed history of a lead's prior consultations (follow-ups / re-schedules).
function PastConsultations({ items }: { items: Consultation[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Box>
      <chakra.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        display="flex"
        alignItems="center"
        gap="8px"
        w="full"
        textAlign="left"
      >
        <Text m="0" color="fg" fontSize="13px" fontWeight="500">
          Past consultations
        </Text>
        <MutedText>{items.length}</MutedText>
        <Box ml="auto" color="fg.muted">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </Box>
      </chakra.button>
      {open ? (
        <Stack gap="0" mt="8px">
          {items.map((c) => (
            <PastConsultationRow key={c.id} consultation={c} />
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}

function PastConsultationRow({ consultation: c }: { consultation: Consultation }) {
  const [showNotes, setShowNotes] = useState(false);
  const tone = CONSULT_STATUS_TONE[c.status];
  const when = c.scheduledAt
    ? `${formatReceivedDate(c.scheduledAt)} · ${formatIsoTime(c.scheduledAt)}`
    : "Not scheduled";
  const notes = c.attorneyNotes?.trim();
  return (
    <Box
      py="8px"
      borderBottom="1px solid"
      borderColor="border.subtle"
      _last={{ borderBottom: 0 }}
    >
      <HStack justify="space-between" gap="10px">
        <HStack gap="8px" minW="0">
          <Box
            flex="0 0 auto"
            w="7px"
            h="7px"
            borderRadius="full"
            bg={TONE_DOT[tone]}
          />
          <Box minW="0">
            <Text m="0" color="fg" fontSize="13px" truncate>
              {consultationModeLabel(c.mode)} · {when}
            </Text>
            {c.outcome ? (
              <MutedText>Outcome: {c.outcome.replace(/_/g, " ")}</MutedText>
            ) : null}
          </Box>
        </HStack>
        <StatusPill tone={tone}>{CONSULT_STATUS_LABEL[c.status]}</StatusPill>
      </HStack>
      {notes ? (
        <Box pl="15px" mt="4px">
          <chakra.button
            type="button"
            onClick={() => setShowNotes((v) => !v)}
            color="brand.fg"
            fontSize="12px"
            fontWeight="500"
          >
            {showNotes ? "Hide attorney notes" : "View attorney notes"}
          </chakra.button>
          {showNotes ? (
            <Text
              m="6px 0 0"
              p="8px 10px"
              bg="bg.subtle"
              borderRadius="6px"
              color="fg"
              fontSize="12px"
              lineHeight="1.5"
              whiteSpace="pre-wrap"
            >
              {notes}
            </Text>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}

// Bare body used when the card is rendered inside a collapsible row (the
// surrounding container already supplies the border and radius).
function BareCardBody({ children }: { children: ReactNode }) {
  return <Box p="18px">{children}</Box>;
}

function SectionRow({ children }: { children: ReactNode }) {
  return (
    <Box mt="16px" pt="14px" borderTop="1px solid" borderColor="border.subtle">
      {children}
    </Box>
  );
}

function SubLabel({ children }: { children: ReactNode }) {
  return (
    <Text
      m="0 0 6px"
      color="fg.muted"
      fontSize="10px"
      fontWeight="600"
      textTransform="uppercase"
    >
      {children}
    </Text>
  );
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const blue = name.charCodeAt(0) % 2 === 0;
  return (
    <Box
      display="grid"
      placeItems="center"
      flex="0 0 auto"
      w={`${size}px`}
      h={`${size}px`}
      borderRadius="full"
      bg={blue ? "#e5efff" : "#d9f8ed"}
      color={blue ? "#1c55b8" : "#00785a"}
      fontSize={size >= 36 ? "12px" : "10px"}
      fontWeight="600"
    >
      {getInitials(name)}
    </Box>
  );
}

function IconSquare({ children }: { children: ReactNode }) {
  return (
    <Box
      display="grid"
      placeItems="center"
      flex="0 0 auto"
      w="34px"
      h="34px"
      borderRadius="9px"
      bg="#d9f8ed"
      color="#00785a"
    >
      {children}
    </Box>
  );
}

function CheckMarker({
  checked,
  tone,
  onClick,
  label,
}: {
  checked: boolean;
  tone: "green" | "gold";
  onClick?: () => void;
  label?: string;
}) {
  const fill = tone === "green" ? "#13b176" : "#e6a52e";
  return (
    <chakra.button
      type="button"
      aria-label={label}
      aria-pressed={onClick ? checked : undefined}
      disabled={!onClick}
      display="grid"
      placeItems="center"
      flex="0 0 auto"
      w="18px"
      h="18px"
      borderRadius="5px"
      border="1px solid"
      borderColor={checked ? fill : "border"}
      bg={checked ? fill : "bg"}
      color="white"
      cursor={onClick ? "pointer" : "default"}
    >
      {checked ? <Check size={12} /> : null}
    </chakra.button>
  );
}

function TextLink({
  children,
  onClick,
  disabled,
  loading,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <chakra.button
      type="button"
      disabled={disabled || loading}
      color="brand.700"
      fontSize="12px"
      fontWeight="500"
      _hover={{ textDecoration: "underline" }}
      _disabled={{ opacity: 0.4, cursor: "default", textDecoration: "none" }}
      onClick={onClick}
    >
      {children}
    </chakra.button>
  );
}

const FEE_STAGES = [
  "Generate",
  "Send",
  "Awaiting signature",
  "Receive",
  "Case opened",
] as const;

function FeeAgreementTracker({ activeIndex }: { activeIndex: number }) {
  return (
    <HStack gap="0" w="full" align="flex-start">
      {FEE_STAGES.map((label, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        return (
          <Fragment key={label}>
            {index > 0 ? (
              <Box
                flex="1"
                h="2px"
                mt="11px"
                bg={index <= activeIndex ? "brand.solid" : "border.subtle"}
              />
            ) : null}
            <Stack gap="6px" align="center" flex="0 0 auto" w="72px">
              <Box
                display="grid"
                placeItems="center"
                w="24px"
                h="24px"
                borderRadius="full"
                border="1px solid"
                borderColor={done || active ? "brand.solid" : "border.subtle"}
                bg={done ? "brand.solid" : "bg"}
                color={done ? "brand.fg" : active ? "brand.solid" : "fg.muted"}
                fontSize="11px"
                fontWeight="600"
              >
                {done ? <Check size={13} /> : index + 1}
              </Box>
              <Text
                m="0"
                fontSize="10px"
                textAlign="center"
                lineHeight="1.2"
                color={done || active ? "fg" : "fg.muted"}
              >
                {label}
              </Text>
            </Stack>
          </Fragment>
        );
      })}
    </HStack>
  );
}

function formatBytes(bytes: number): string {
  if (!bytes) return "0 KB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function titleCase(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

const scheduleSchema = z
  .object({
    selectedLeadId: z.string().min(1, "Select a lead"),
    durationChoice: z.union([
      z.literal(30),
      z.literal(45),
      z.literal(60),
      z.literal(90),
      z.literal("custom"),
    ]),
    customDuration: z.string(),
    consultationType: z.enum(["video", "in_person", "phone_call"]),
    attorneyId: z.string().min(1, "Select an attorney"),
    participantIds: z.array(z.string()),
    locationId: z.string(),
    feeAmount: z.string(),
    notes: z.string(),
    notifyEmail: z.boolean(),
    notifySms: z.boolean(),
    // Urgent (admin fast-track): schedule now, lead skips the slot queue.
    urgent: z.boolean(),
    urgentDate: z.string(),
    urgentTime: z.string(),
  })
  .superRefine((val, ctx) => {
    const dur =
      val.durationChoice === "custom"
        ? parseInt(val.customDuration, 10)
        : val.durationChoice;
    if (!dur || dur <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customDuration"],
        message: "Enter a duration in minutes",
      });
    }
    if (val.consultationType === "in_person" && !val.locationId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["locationId"],
        message: "Select a location for in-person consultations",
      });
    }
    if (val.urgent && !val.urgentDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["urgentDate"],
        message: "Pick a date",
      });
    }
    if (val.urgent && !val.urgentTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["urgentTime"],
        message: "Pick a time",
      });
    }
  });

type ScheduleForm = z.infer<typeof scheduleSchema>;

const SCHEDULE_DEFAULTS: ScheduleForm = {
  selectedLeadId: "",
  durationChoice: 60,
  customDuration: "",
  consultationType: "video",
  attorneyId: "",
  participantIds: [],
  locationId: "",
  feeAmount: "",
  notes: "",
  notifyEmail: true,
  notifySms: false,
  urgent: false,
  urgentDate: "",
  urgentTime: "",
};

function ScheduleConsultationDialog({
  open,
  onOpenChange,
  presetLead,
  presetAttorneyId,
  parentConsultationId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetLead?: ConsultationSummaryLead | null;
  presetAttorneyId?: string | null;
  parentConsultationId?: string;
}) {
  const presetLeadId = presetLead?.id ?? null;
  const [step, setStep] = useState<ScheduleStep>(1);
  const {
    control,
    setValue,
    reset,
    trigger,
    handleSubmit,
    formState: { errors },
  } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: SCHEDULE_DEFAULTS,
    mode: "onChange",
  });
  const attorneyId = useWatch({ control, name: "attorneyId" });
  const selectedLeadId = useWatch({ control, name: "selectedLeadId" });
  const customDuration = useWatch({ control, name: "customDuration" });
  const durationChoice = useWatch({ control, name: "durationChoice" });
  const consultationType = useWatch({ control, name: "consultationType" });
  const participantIds = useWatch({ control, name: "participantIds" });
  const locationId = useWatch({ control, name: "locationId" });
  const feeAmount = useWatch({ control, name: "feeAmount" });
  const notes = useWatch({ control, name: "notes" });
  const notifyEmail = useWatch({ control, name: "notifyEmail" });
  const notifySms = useWatch({ control, name: "notifySms" });
  const urgent = useWatch({ control, name: "urgent" });
  const urgentDate = useWatch({ control, name: "urgentDate" });
  const urgentTime = useWatch({ control, name: "urgentTime" });
  const setField = <K extends keyof ScheduleForm>(
    key: K,
    value: ScheduleForm[K],
  ) => setValue(key, value as never, { shouldValidate: true });

  // Eligible candidates have cleared conflict check — that's everyone in the
  // questionnaire stage (regardless of completion) plus consultation-stage leads
  // who don't yet have a consultation booked.
  const { data: questionnaireData } = useLeads({ stage: "questionnaire" });
  const { data: consultationData } = useLeads({ stage: "consultation" });
  const questionnaireLeads = Array.isArray(questionnaireData)
    ? questionnaireData
    : (questionnaireData?.leads ?? []);
  const consultationLeads = Array.isArray(consultationData)
    ? consultationData
    : (consultationData?.leads ?? []);
  const leads = [
    ...questionnaireLeads,
    ...consultationLeads.filter((l) => !l.consultationId),
  ];

  const { data: staffData } = useStaffList({ status: "active" });
  const allStaff = staffData?.data ?? [];
  const attorneys = allStaff.filter((s) => s.role === "attorney");

  const { data: feeSettings } = useConsultationSettings();
  const { data: locations = [] } = useConsultationLocations();
  const createLocation = useCreateConsultationLocation();

  const initiateConsultation = useInitiateConsultation();

  // Preselect the lead when the dialog is opened from a specific card, and skip
  // straight to step 2 since the lead is already chosen. Done during render
  // (adjust-state-on-prop-change) to avoid an extra effect.
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      reset({
        ...SCHEDULE_DEFAULTS,
        selectedLeadId: presetLeadId ?? "",
        attorneyId: presetAttorneyId ?? "",
      });
      setStep(presetLeadId ? 2 : 1);
    }
  }

  // Fall back to the preset lead: a follow-up lead may have advanced past the
  // consultation stage and so not appear in the candidate list.
  const selectedLead =
    leads.find((l) => l.id === selectedLeadId) ??
    (presetLead && presetLead.id === selectedLeadId ? presetLead : undefined);
  const { data: questionnaire } = useLeadQuestionnaire(selectedLeadId);
  const language = questionnaire?.send?.language ?? "English";
  const matterType = selectedLead?.caseTypeName ?? "Not specified";

  const durationLabel =
    durationChoice === "custom"
      ? customDuration
        ? `${customDuration} minutes`
        : "—"
      : `${durationChoice} minutes`;
  const attorneyName = (() => {
    const a = attorneys.find((s) => s.id === attorneyId);
    return a ? `${a.firstName} ${a.lastName}`.trim() : "Not assigned";
  })();
  const participantNames = participantIds
    .map((id) => {
      const member = allStaff.find((m) => m.id === id);
      return member ? `${member.firstName} ${member.lastName}`.trim() : null;
    })
    .filter(Boolean)
    .join(", ");
  const locationLabel =
    locations.find((l) => l.id === locationId)?.label ?? "—";
  const notifyChannels: ("email" | "sms")[] = [
    ...(notifyEmail ? (["email"] as const) : []),
    ...(notifySms ? (["sms"] as const) : []),
  ];

  function closeDialog() {
    onOpenChange(false);
    reset(SCHEDULE_DEFAULTS);
    setStep(1);
  }

  async function handleContinue() {
    if (step === 1) {
      if (await trigger(["selectedLeadId"])) setStep(2);
      return;
    }
    if (step === 2) {
      if (
        await trigger([
          "customDuration",
          "attorneyId",
          "locationId",
          "urgentDate",
          "urgentTime",
        ])
      )
        setStep(3);
    }
  }

  const chargesFee = Boolean(feeSettings?.chargesFee);
  const chargesCustomFee =
    chargesFee && feeSettings?.feeStructure === "custom_per_case_type";

  const onValid = (data: ScheduleForm) => {
    const duration =
      data.durationChoice === "custom"
        ? parseInt(data.customDuration, 10)
        : data.durationChoice;

    if (chargesCustomFee && !data.feeAmount.trim()) {
      toast.error("Enter the consultation fee for this case type");
      setStep(3);
      return;
    }

    // Urgent bookings may override the fee (urgency surcharge) even when the
    // structure isn't custom-per-case-type.
    const feeEditable = chargesCustomFee || (data.urgent && chargesFee);
    const feeAmount =
      feeEditable && data.feeAmount.trim() ? Number(data.feeAmount) : undefined;

    const scheduledAt = data.urgent
      ? new Date(`${data.urgentDate}T${data.urgentTime}:00Z`).toISOString()
      : undefined;

    initiateConsultation.mutate(
      {
        id: data.selectedLeadId,
        data: {
          leadAttorneyId: data.attorneyId,
          participantStaffIds: data.participantIds.length
            ? data.participantIds
            : undefined,
          mode: data.consultationType,
          duration,
          locationId:
            data.consultationType === "in_person"
              ? data.locationId || undefined
              : undefined,
          feeAmount,
          preConsultationNotes: data.notes || undefined,
          notifyChannels: [
            ...(data.notifyEmail ? (["email"] as const) : []),
            ...(data.notifySms ? (["sms"] as const) : []),
          ],
          urgent: data.urgent || undefined,
          scheduledAt,
          parentConsultationId: parentConsultationId || undefined,
        },
      },
      { onSuccess: () => closeDialog() },
    );
  };

  const onInvalid = () => {
    // Jump back to the step that holds the first error.
    if (errors.selectedLeadId) setStep(1);
    else if (
      errors.customDuration ||
      errors.attorneyId ||
      errors.locationId ||
      errors.urgentDate ||
      errors.urgentTime
    )
      setStep(2);
  };

  const handleConfirm = handleSubmit(onValid, onInvalid);

  return (
    <Dialog.Root
      open={open}
      lazyMount
      unmountOnExit
      onOpenChange={(details) => {
        if (details.open) {
          onOpenChange(true);
        } else {
          closeDialog();
        }
      }}
      placement="center"
    >
      <Dialog.Backdrop bg="rgba(0, 0, 0, 0.46)" />
      <Dialog.Positioner px="16px">
        <Dialog.Content
          w="full"
          maxW="560px"
          maxH="calc(100vh - 72px)"
          border="1px solid"
          borderColor="border"
          borderRadius="14px"
          bg="bg"
          p="0"
          boxShadow="0 24px 70px rgba(0, 0, 0, 0.26)"
        >
          <Flex direction="column" maxH="calc(100vh - 72px)">
            <Box p="24px 24px 12px">
              <Flex align="flex-start" justify="space-between" gap="16px">
                <Box minW="0">
                  <Dialog.Title
                    color="fg"
                    fontSize="17px"
                    fontWeight="600"
                    lineHeight="1.2"
                  >
                    {STEP_META[step].title}
                  </Dialog.Title>
                  <Dialog.Description
                    mt="6px"
                    color="fg.muted"
                    fontSize="12px"
                    lineHeight="1.45"
                  >
                    {STEP_META[step].label}
                  </Dialog.Description>
                </Box>
                <Dialog.CloseTrigger asChild>
                  <chakra.button
                    type="button"
                    aria-label="Close schedule consultation"
                    display="grid"
                    placeItems="center"
                    flex="0 0 auto"
                    w="34px"
                    h="34px"
                    border="1px solid"
                    borderColor="border"
                    borderRadius="full"
                    bg="bg"
                    color="fg.muted"
                  >
                    <X size={16} />
                  </chakra.button>
                </Dialog.CloseTrigger>
              </Flex>

              <StepProgress step={step} />
            </Box>

            <Box flex="1" minH="0" px="24px" pb="20px">
              {step === 1 ? (
                <SelectClientStep
                  leads={leads}
                  selectedLeadId={selectedLeadId}
                  matterType={matterType}
                  language={language}
                  touched={Boolean(errors.selectedLeadId)}
                  onSelect={(leadId) => setField("selectedLeadId", leadId)}
                />
              ) : null}
              {step === 2 ? (
                <ScheduleDetailsStep
                  durationChoice={durationChoice}
                  customDuration={customDuration}
                  consultationType={consultationType}
                  attorneyId={attorneyId}
                  attorneys={attorneys}
                  allStaff={allStaff}
                  participantIds={participantIds}
                  locationId={locationId}
                  locations={locations}
                  notes={notes}
                  notifyEmail={notifyEmail}
                  urgent={urgent}
                  urgentDate={urgentDate}
                  urgentTime={urgentTime}
                  touchedField={
                    errors.customDuration
                      ? "duration"
                      : errors.attorneyId
                        ? "attorney"
                        : errors.locationId
                          ? "location"
                          : errors.urgentDate
                            ? "urgentDate"
                            : errors.urgentTime
                              ? "urgentTime"
                              : null
                  }
                  onUrgentChange={(value) => setField("urgent", value)}
                  onUrgentDateChange={(value) => setField("urgentDate", value)}
                  onUrgentTimeChange={(value) => setField("urgentTime", value)}
                  onDurationChoiceChange={(value) =>
                    setField("durationChoice", value)
                  }
                  onCustomDurationChange={(value) =>
                    setField("customDuration", value)
                  }
                  onConsultationTypeChange={(value) =>
                    setField("consultationType", value)
                  }
                  onAttorneyChange={(value) => setField("attorneyId", value)}
                  onParticipantsChange={(value) =>
                    setField("participantIds", value)
                  }
                  onLocationChange={(value) => setField("locationId", value)}
                  onCreateLocation={async (label) => {
                    const created = await createLocation.mutateAsync({ label });
                    setField("locationId", created.id);
                  }}
                  creatingLocation={createLocation.isPending}
                  onNotesChange={(value) => setField("notes", value)}
                  onNotifyEmailChange={(value) =>
                    setField("notifyEmail", value)
                  }
                />
              ) : null}
              {step === 3 && selectedLead ? (
                <ReviewStep
                  lead={selectedLead}
                  duration={durationLabel}
                  consultationType={consultationModeLabel(consultationType)}
                  attorney={attorneyName}
                  participantNames={participantNames}
                  mode={consultationType}
                  locationLabel={locationLabel}
                  notifyChannels={notifyChannels}
                  notes={notes}
                  urgent={urgent}
                  urgentAt={
                    urgent && urgentDate && urgentTime
                      ? `${urgentDate} ${urgentTime} UTC`
                      : null
                  }
                  feeSettings={feeSettings ?? null}
                  feeAmount={feeAmount}
                  onFeeAmountChange={(value) => setField("feeAmount", value)}
                />
              ) : null}
            </Box>

            <Flex
              align="center"
              justify="space-between"
              gap="12px"
              p="14px 24px"
              borderTop="1px solid"
              borderColor="border.subtle"
              borderBottomRadius="14px"
              bg="bg"
            >
              {step > 1 ? (
                <OutlineButton
                  onClick={() => setStep((s) => (s - 1) as ScheduleStep)}
                >
                  Back
                </OutlineButton>
              ) : (
                <Box />
              )}
              <HStack gap="10px">
                <OutlineButton onClick={closeDialog}>Cancel</OutlineButton>
                {step < 3 ? (
                  <BrandButton minW="100px" onClick={handleContinue}>
                    Next
                  </BrandButton>
                ) : (
                  <BrandButton
                    minW="180px"
                    loading={initiateConsultation.isPending}
                    onClick={handleConfirm}
                  >
                    Confirm &amp; schedule
                  </BrandButton>
                )}
              </HStack>
            </Flex>
          </Flex>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}

function StepProgress({ step }: { step: ScheduleStep }) {
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
        w={`${(step / 3) * 100}%`}
        transition="width 0.2s ease"
      />
    </Box>
  );
}

function SelectClientStep({
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

function StepFieldLabel({
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

function CheckOption({
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
function ModeNote({ icon, children }: { icon: ReactNode; children: ReactNode }) {
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

function ScheduleDetailsStep({
  durationChoice,
  customDuration,
  consultationType,
  attorneyId,
  attorneys,
  allStaff,
  participantIds,
  locationId,
  locations,
  notes,
  notifyEmail,
  urgent,
  urgentDate,
  urgentTime,
  touchedField,
  onUrgentChange,
  onUrgentDateChange,
  onUrgentTimeChange,
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
  notes: string;
  notifyEmail: boolean;
  urgent: boolean;
  urgentDate: string;
  urgentTime: string;
  touchedField:
    | "duration"
    | "attorney"
    | "location"
    | "urgentDate"
    | "urgentTime"
    | null;
  onUrgentChange: (value: boolean) => void;
  onUrgentDateChange: (value: string) => void;
  onUrgentTimeChange: (value: string) => void;
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

  const participantOptions = allStaff.filter(
    (s) => s.id !== attorneyId && (s.role === "attorney" || s.role === "paralegal"),
  );
  const addedParticipants = participantOptions.filter((s) =>
    participantIds.includes(s.id),
  );
  const attendeeMatches = attendeeQuery.trim()
    ? participantOptions.filter(
        (s) =>
          !participantIds.includes(s.id) &&
          `${s.firstName} ${s.lastName}`
            .toLowerCase()
            .includes(attendeeQuery.toLowerCase()),
      )
    : [];

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
                options={locations.map((loc) => ({
                  value: loc.id,
                  label: loc.label,
                }))}
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

      {/* Time — lead-driven by default; urgent lets the admin book now */}
      <Box>
        <Flex align="center" justify="space-between" mb="8px">
          <StepFieldLabel required>
            {urgent ? "Scheduled time" : "Available time slots"}
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
          <Stack gap="10px">
            <ModeNote icon={<CalendarClock size={14} />}>
              The lead skips the slot queue and is connected as soon as they pay
              (if a fee applies). Times are in UTC.
            </ModeNote>
            <Grid templateColumns="1fr 1fr" gap="10px">
              <Box>
                <StepFieldLabel required>Date</StepFieldLabel>
                <DateField
                  ariaLabel="Consultation date"
                  value={urgentDate}
                  onChange={onUrgentDateChange}
                  min={new Date().toISOString().slice(0, 10)}
                  invalid={touchedField === "urgentDate"}
                />
              </Box>
              <Box>
                <StepFieldLabel required>Time (UTC)</StepFieldLabel>
                <TimeField
                  ariaLabel="Consultation time"
                  value={urgentTime}
                  onChange={onUrgentTimeChange}
                  invalid={touchedField === "urgentTime"}
                />
              </Box>
            </Grid>
          </Stack>
        ) : (
          <ModeNote icon={<CalendarClock size={14} />}>
            The lead chooses a time from the selected attorney's availability —
            they'll receive a link to pick the slot that works for them.
          </ModeNote>
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
          options={attorneys.map((attorney) => ({
            value: attorney.id,
            label: `${attorney.firstName} ${attorney.lastName}`.trim(),
          }))}
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
        <Textarea
          value={notes}
          onChange={(event) => onNotesChange(event.currentTarget.value)}
          minH="92px"
          resize="vertical"
          placeholder="Add any notes for the attorney before the consultation."
          {...fieldStyles}
          h="auto"
          py="10px"
        />
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

function ReviewStep({
  lead,
  duration,
  consultationType,
  mode,
  attorney,
  participantNames,
  locationLabel,
  notifyChannels,
  notes,
  urgent,
  urgentAt,
  feeSettings,
  feeAmount,
  onFeeAmountChange,
}: {
  lead: { name: string };
  duration: string;
  consultationType: string;
  mode: ConsultationMode;
  attorney: string;
  participantNames: string;
  locationLabel: string;
  notifyChannels: ("email" | "sms")[];
  notes: string;
  urgent: boolean;
  urgentAt: string | null;
  feeSettings: ConsultationSettings | null;
  feeAmount: string;
  onFeeAmountChange: (value: string) => void;
}) {
  const notifyLabel =
    notifyChannels.length === 0
      ? "No notification"
      : notifyChannels.map((c) => (c === "email" ? "Email" : "SMS")).join(", ");

  const charges = Boolean(feeSettings?.chargesFee);
  const structure = feeSettings?.feeStructure;
  // Urgent bookings let the admin set the amount (urgency surcharge) even when
  // the firm's structure isn't custom-per-case-type.
  const feeEditable = structure === "custom_per_case_type" || urgent;

  return (
    <Stack gap="16px" pt="12px">
      <Text m="0" fontSize="14px" fontWeight="600" color="fg">
        Review consultation details
      </Text>

      <Box p="14px 16px" borderRadius="10px" bg="bg.subtle">
        <SummaryItem label="Lead">{lead.name}</SummaryItem>
        <SummaryItem label="Consultation type">{consultationType}</SummaryItem>
        {mode === "in_person" ? (
          <SummaryItem label="Location">{locationLabel}</SummaryItem>
        ) : null}
        <SummaryItem label="Scheduling">
          {urgent ? "Urgent — schedule now" : "Lead picks a time"}
        </SummaryItem>
        {urgent && urgentAt ? (
          <SummaryItem label="Scheduled time">{urgentAt}</SummaryItem>
        ) : null}
        <SummaryItem label="Duration">{duration}</SummaryItem>
        <SummaryItem label="Attorney">{attorney}</SummaryItem>
        {participantNames ? (
          <SummaryItem label="Additional attendees">
            {participantNames}
          </SummaryItem>
        ) : null}
        <SummaryItem label="Notification">{notifyLabel}</SummaryItem>
        {notes ? <SummaryItem label="Notes">{notes}</SummaryItem> : null}
      </Box>

      <Box borderTop="1px solid" borderColor="border.subtle" />

      <Box>
        <Text
          textTransform="uppercase"
          fontSize="11px"
          fontWeight="600"
          letterSpacing="0.04em"
          color="fg.muted"
          mb="12px"
        >
          Consultation fee
        </Text>

        <Flex align="flex-start" justify="space-between" gap="12px">
          <Box>
            <Text m="0" fontSize="13px" fontWeight="600" color="fg">
              Charge consultation fee
            </Text>
            <Text m="2px 0 0" fontSize="12px" color="fg.muted">
              Default set in firm settings
            </Text>
          </Box>
          <Switch.Root checked={charges} disabled>
            <Switch.HiddenInput />
            <Switch.Control bg={charges ? "brand.solid" : "bg.muted"}>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </Flex>

        {charges ? (
          <>
            <Flex align="center" justify="space-between" mt="16px">
              <Text fontSize="13px" color="fg">
                Fee amount
              </Text>
              <HStack gap="6px">
                <Text fontSize="14px" color="fg.muted">
                  $
                </Text>
                {feeEditable ? (
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={feeAmount}
                    onChange={(e) => onFeeAmountChange(e.currentTarget.value)}
                    placeholder={feeSettings?.defaultAmount?.toString() ?? "0.00"}
                    maxW="96px"
                    textAlign="right"
                    {...fieldStyles}
                  />
                ) : (
                  <Text fontSize="14px" fontWeight="600" color="fg">
                    {feeSettings?.defaultAmount ?? 0}
                  </Text>
                )}
                <Text fontSize="12px" color="fg.muted">
                  per session
                </Text>
              </HStack>
            </Flex>

            {structure === "waived_if_retainer" ? (
              <MutedText>
                Waived if the client signs a retainer within{" "}
                {feeSettings?.waiverWindowDays ?? 0} days.
              </MutedText>
            ) : null}

            <HStack
              mt="14px"
              align="flex-start"
              gap="10px"
              p="12px"
              border="1px solid"
              borderColor="#377dff"
              borderRadius="8px"
              bg="#e8f1ff"
              color="#0f4aa8"
              fontSize="12px"
              lineHeight="1.45"
            >
              <Info size={14} />
              <Text m="0">
                {urgent
                  ? "A payment link will be emailed to the client; as soon as they pay they'll be connected with the attorney. Payment goes to the firm's operating account."
                  : "A payment link will be included in the client confirmation email. Payment goes to the firm's operating account."}
              </Text>
            </HStack>
          </>
        ) : null}
      </Box>
    </Stack>
  );
}

function ChoiceChip({
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

function ReadOnlyField({
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

function SummaryItem({
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

const invalidColor = "#ff2d55";

const fieldStyles = {
  w: "full",
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
