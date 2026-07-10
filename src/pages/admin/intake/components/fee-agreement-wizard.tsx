import {
  Box,
  HStack,
  Input,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  chakra,
} from "@chakra-ui/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Divide,
  DollarSign,
  FileText,
  Info,
  Lock,
  NotebookPen,
  Percent,
  Plus,
  Scale,
  Shield,
  Trash2,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";
import { Fragment, useState } from "react";
import type { FieldPath } from "react-hook-form";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type {
  FeeAgreementDetails,
  GenerateFeeAgreementInput,
  Lead,
} from "@/api/leads";
import { useFirmPracticeAreas } from "@/hooks/use-firm-practice-areas";
import {
  BrandButton,
  MutedText,
  OutlineButton,
} from "@/components/ui/intake-ui";
import { CheckOption, ChoiceChip } from "./consultation-wizard-shared";
import { fieldStyles } from "./consultation-wizard-constants";
import {
  getContingencyFit,
  getCostPreset,
  type CostPreset,
} from "./fee-agreement-cost-presets";

// ── Form schema (string-input pattern) ────────────────────────────────────────

const wizardSchema = z
  .object({
    // No preselection — the attorney must pick a structure in step 1.
    feeType: z.enum(["flat", "hourly", "flat_hourly", "contingency"]).nullable(),
    flatRate: z.string(), // flat total, or the initial retainer for flat_hourly
    hourlyRate: z.string(),
    estimatedHours: z.string(),
    contingencyPercent: z.string(),
    coversCaseCosts: z.boolean(),
    coversExpertWitness: z.boolean(),
    ifLost: z.enum(["client_owes_nothing", "client_reimburses_hard_costs"]),
    governmentFees: z.array(z.object({ name: z.string(), amount: z.string() })),
    otherCosts: z.array(
      z.object({ included: z.boolean(), name: z.string(), amount: z.string() }),
    ),
    paymentPlan: z.enum(["pay_in_full", "two_payments", "installments"]),
    twoPayFirst: z.string(),
    twoPaySecond: z.string(),
    twoPaySecondDate: z.string(),
    instMonthly: z.string(),
    instCount: z.string(),
    instFirstDate: z.string(),
    allocationOrder: z.enum(["fees_first", "costs_first", "custom"]),
    customFeePercent: z.string(),
    applyConsultationCredit: z.boolean(),
    abaCompliance: z.boolean(),
    abaFeeMethod: z.boolean(),
    abaAlternatives: z.boolean(),
  })
  .superRefine((val, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
    if (!val.feeType) {
      issue(["feeType"], "Select a fee structure to continue");
      return;
    }
    if (
      (val.feeType === "flat" || val.feeType === "flat_hourly") &&
      !(Number(val.flatRate) > 0)
    )
      issue(
        ["flatRate"],
        val.feeType === "flat"
          ? "Enter the total attorney fee"
          : "Enter the initial retainer",
      );
    if (
      (val.feeType === "hourly" || val.feeType === "flat_hourly") &&
      !(Number(val.hourlyRate) > 0)
    )
      issue(["hourlyRate"], "Enter the hourly rate");
    if (val.feeType === "hourly" && !(Number(val.estimatedHours) > 0))
      issue(["estimatedHours"], "Enter the estimated hours");
    if (val.feeType === "contingency") {
      const pct = Number(val.contingencyPercent);
      if (!val.contingencyPercent.trim() || !(pct > 0) || pct > 100)
        issue(["contingencyPercent"], "Enter a percentage between 0 and 100");
    }
    val.governmentFees.forEach((g, i) => {
      if (!g.name.trim()) issue(["governmentFees", i, "name"], "Name required");
      if (!g.amount.trim())
        issue(["governmentFees", i, "amount"], "Amount required");
    });
    val.otherCosts.forEach((c, i) => {
      if (c.included && !c.name.trim())
        issue(["otherCosts", i, "name"], "Name required");
    });
    if (val.feeType === "contingency") {
      // All three ABA 1.5(c) confirmations are mandatory before generating.
      if (!val.abaCompliance) issue(["abaCompliance"], "Required");
      if (!val.abaFeeMethod) issue(["abaFeeMethod"], "Required");
      if (!val.abaAlternatives) issue(["abaAlternatives"], "Required");
    } else {
      if (val.paymentPlan === "two_payments") {
        if (!(Number(val.twoPayFirst) > 0))
          issue(["twoPayFirst"], "Enter payment 1");
        if (!(Number(val.twoPaySecond) > 0))
          issue(["twoPaySecond"], "Enter payment 2");
        if (!val.twoPaySecondDate)
          issue(["twoPaySecondDate"], "Pick the due date");
      }
      if (val.paymentPlan === "installments") {
        const months = Number(val.instCount);
        if (!(Number(val.instMonthly) > 0))
          issue(["instMonthly"], "Enter the monthly amount");
        if (!Number.isInteger(months) || months < 2)
          issue(["instCount"], "At least 2 payments");
        if (!val.instFirstDate)
          issue(["instFirstDate"], "Pick the first payment date");
      }
      if (val.allocationOrder === "custom") {
        const pct = Number(val.customFeePercent);
        if (!val.customFeePercent.trim() || !(pct > 0) || pct >= 100)
          issue(["customFeePercent"], "Enter a percentage between 0 and 100");
      }
    }
  });

type WizardForm = z.infer<typeof wizardSchema>;

// Fields validated by the Next button of each step (the final step validates
// everything via submit). Every superRefine issue above is pathed to a field
// inside its own step so trigger() surfaces it at the right time.
const STEP_FIELDS: FieldPath<WizardForm>[][] = [
  ["feeType", "flatRate", "hourlyRate", "estimatedHours", "contingencyPercent"],
  ["governmentFees", "otherCosts"],
];

const WIZARD_STEPS = ["Fee structure", "Costs", "Payment plan"] as const;

const FEE_TYPE_CARDS: {
  value: NonNullable<WizardForm["feeType"]>;
  title: string;
  description: string;
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    value: "flat",
    title: "Flat fee",
    description: "Fixed total amount",
    icon: <DollarSign size={16} />,
    iconBg: "#d9f8ed",
    iconColor: "#00785a",
  },
  {
    value: "hourly",
    title: "Hourly rate",
    description: "Billed per hour worked",
    icon: <Clock size={16} />,
    iconBg: "#fbefd8",
    iconColor: "#8a641d",
  },
  {
    value: "flat_hourly",
    title: "Flat + hourly",
    description: "Retainer upfront, then hourly",
    icon: <NotebookPen size={16} />,
    iconBg: "#ece7fb",
    iconColor: "#534AB7",
  },
  {
    value: "contingency",
    title: "Contingency",
    description: "% of settlement — no upfront fee",
    icon: <Percent size={16} />,
    iconBg: "#ffe2e4",
    iconColor: "#b00020",
  },
];

const FEE_TYPE_LABELS: Record<NonNullable<WizardForm["feeType"]>, string> = {
  flat: "Flat fee",
  hourly: "Hourly rate",
  flat_hourly: "Flat + hourly",
  contingency: "Contingency",
};

const PAYMENT_PLAN_LABELS: Record<WizardForm["paymentPlan"], string> = {
  pay_in_full: "Pay in full",
  two_payments: "Two payments",
  installments: "Instalment plan",
};

const IF_LOST_LABELS: Record<WizardForm["ifLost"], string> = {
  client_owes_nothing: "Client owes nothing",
  client_reimburses_hard_costs: "Client reimburses hard costs",
};

const FIT_TONES = {
  success: { bg: "#d9f8ed", color: "#00785a" },
  info: { bg: "#e7f0ff", color: "#2f63c7" },
  neutral: { bg: "#f1eee6", color: "#6b6252" },
} as const;

const fmtMoney = (n: number): string =>
  `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const emptyFormValues = (preset: CostPreset): WizardForm => ({
  feeType: null,
  flatRate: "",
  hourlyRate: "",
  estimatedHours: "",
  contingencyPercent: "",
  coversCaseCosts: true,
  coversExpertWitness: false,
  ifLost: "client_owes_nothing",
  governmentFees: preset.governmentFees,
  otherCosts: preset.otherCosts,
  paymentPlan: "pay_in_full",
  twoPayFirst: "",
  twoPaySecond: "",
  twoPaySecondDate: "",
  instMonthly: "",
  instCount: "12",
  instFirstDate: "",
  allocationOrder: "fees_first",
  customFeePercent: "50",
  applyConsultationCredit: false,
  abaCompliance: false,
  abaFeeMethod: false,
  abaAlternatives: false,
});

// Seeds the form from a discarded draft's stored details so the attorney can
// adjust and regenerate. The ABA confirmations deliberately reset — they must
// be re-affirmed for the regenerated agreement.
const detailsToFormValues = (
  details: FeeAgreementDetails,
  preset: CostPreset,
): WizardForm => {
  const empty = emptyFormValues(preset);
  const af = details.attorneyFee;
  return {
    ...empty,
    feeType: af.type,
    flatRate: af.flatRate != null ? String(af.flatRate) : "",
    hourlyRate: af.hourlyRate != null ? String(af.hourlyRate) : "",
    estimatedHours: af.estimatedHours != null ? String(af.estimatedHours) : "",
    contingencyPercent:
      af.contingencyPercent != null ? String(af.contingencyPercent) : "",
    coversCaseCosts: details.contingencyTerms?.coversCaseCosts ?? true,
    coversExpertWitness:
      details.contingencyTerms?.coversExpertWitnessFees ?? false,
    ifLost: details.contingencyTerms?.ifLost ?? "client_owes_nothing",
    governmentFees: details.governmentFees.length
      ? details.governmentFees.map((g) => ({
          name: g.name,
          amount: String(g.amount),
        }))
      : preset.governmentFees,
    // Only rows the attorney included were persisted, so they all come back
    // checked; unchecked preset rows from the original session are not kept.
    otherCosts: details.otherCosts?.length
      ? details.otherCosts.map((c) => ({
          included: true,
          name: c.name,
          amount: String(c.amount),
        }))
      : preset.otherCosts,
    paymentPlan: details.paymentPlan ?? "pay_in_full",
    twoPayFirst: details.twoPaymentsSchedule
      ? String(details.twoPaymentsSchedule.firstAmount)
      : "",
    twoPaySecond: details.twoPaymentsSchedule
      ? String(details.twoPaymentsSchedule.secondAmount)
      : "",
    twoPaySecondDate: details.twoPaymentsSchedule?.secondDueDate ?? "",
    instMonthly: details.installmentSchedule
      ? String(details.installmentSchedule.monthlyAmount)
      : "",
    instCount: details.installmentSchedule
      ? String(details.installmentSchedule.numberOfPayments)
      : "12",
    instFirstDate: details.installmentSchedule?.firstPaymentDate ?? "",
    allocationOrder: details.paymentAllocation?.order ?? "fees_first",
    customFeePercent:
      details.paymentAllocation?.customFeePercent != null
        ? String(details.paymentAllocation.customFeePercent)
        : "50",
    applyConsultationCredit: details.applyConsultationCredit,
  };
};

// ── Small local UI pieces ─────────────────────────────────────────────────────

function MicroLabel({ children }: { children: ReactNode }) {
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

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <Text m="4px 0 0" fontSize="11px" color="#b00020">
      {msg}
    </Text>
  );
}

function WizardStepIndicator({ step }: { step: number }) {
  return (
    <HStack gap="10px" w="full" mb="4px">
      {WIZARD_STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <Fragment key={label}>
            {i > 0 ? <Box flex="1" h="1px" bg="border.subtle" /> : null}
            <HStack gap="8px" flex="0 0 auto">
              <Box
                display="grid"
                placeItems="center"
                w="24px"
                h="24px"
                borderRadius="full"
                border="1px solid"
                borderColor={done ? "#00785a" : active ? "brand.solid" : "border"}
                bg={done ? "#00785a" : active ? "brand.solid" : "bg"}
                color={done ? "white" : active ? "brand.fg" : "fg.muted"}
                fontSize="11px"
                fontWeight="600"
              >
                {done ? <Check size={13} /> : i + 1}
              </Box>
              <Text
                m="0"
                fontSize="12px"
                fontWeight={active ? "600" : "500"}
                color={done || active ? "fg" : "fg.muted"}
              >
                {label}
              </Text>
            </HStack>
          </Fragment>
        );
      })}
    </HStack>
  );
}

// Bordered selectable card (fee-type grid). Contains no interactive children,
// so it can be a real button.
function SelectableCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <chakra.button
      type="button"
      onClick={onClick}
      textAlign="left"
      w="full"
      p="14px 16px"
      border="1px solid"
      borderColor={selected ? "brand.solid" : "border"}
      borderRadius="10px"
      bg={selected ? "#faf3dc" : "bg"}
      _hover={{ borderColor: "brand.solid" }}
    >
      {children}
    </chakra.button>
  );
}

// Radio-style row that can expand with form inputs when selected. The header is
// the button; children render outside it so nested inputs stay valid HTML.
function RadioRow({
  selected,
  onSelect,
  title,
  description,
  children,
}: {
  selected: boolean;
  onSelect: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Box
      border="1px solid"
      borderColor={selected ? "brand.solid" : "border"}
      borderRadius="10px"
      bg={selected ? "#faf3dc" : "bg"}
    >
      <chakra.button
        type="button"
        onClick={onSelect}
        display="flex"
        alignItems="flex-start"
        gap="10px"
        textAlign="left"
        w="full"
        p="13px 16px"
      >
        <Box
          mt="2px"
          w="16px"
          h="16px"
          flex="0 0 auto"
          borderRadius="full"
          border="1px solid"
          borderColor={selected ? "brand.solid" : "border"}
          bg="bg"
          display="grid"
          placeItems="center"
        >
          {selected ? (
            <Box w="8px" h="8px" borderRadius="full" bg="brand.solid" />
          ) : null}
        </Box>
        <Box>
          <Text m="0" fontSize="13px" fontWeight="600" color="fg">
            {title}
          </Text>
          {description ? (
            <Text m="2px 0 0" fontSize="12px" color="fg.muted">
              {description}
            </Text>
          ) : null}
        </Box>
      </chakra.button>
      {selected && children ? (
        <Box px="16px" pb="14px" pl="42px">
          {children}
        </Box>
      ) : null}
    </Box>
  );
}

// Bordered checkbox row with a title + optional subtitle (covers list, ABA
// confirmations). Contains no inputs, so it can be a real button.
function CheckRow({
  checked,
  onToggle,
  title,
  description,
  disabled,
  locked,
}: {
  checked: boolean;
  onToggle: () => void;
  title: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  locked?: boolean;
}) {
  return (
    <chakra.button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      display="flex"
      alignItems="flex-start"
      gap="10px"
      textAlign="left"
      w="full"
      p="12px 16px"
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      opacity={disabled ? 0.6 : 1}
      cursor={disabled ? "not-allowed" : "pointer"}
    >
      <Box
        mt="2px"
        w="16px"
        h="16px"
        flex="0 0 auto"
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
      <Box flex="1">
        <Text m="0" fontSize="13px" fontWeight="500" color="fg">
          {title}
        </Text>
        {description ? (
          <Text m="2px 0 0" fontSize="12px" color="fg.muted">
            {description}
          </Text>
        ) : null}
      </Box>
      {locked ? (
        <Box color="fg.muted" mt="2px">
          <Lock size={12} />
        </Box>
      ) : null}
    </chakra.button>
  );
}

function SectionTag({
  tone,
  icon,
  children,
}: {
  tone: "trust" | "operating";
  icon?: ReactNode;
  children: ReactNode;
}) {
  const colors =
    tone === "trust"
      ? { bg: "#ece7fb", color: "#534AB7" }
      : { bg: "#d9f8ed", color: "#00785a" };
  return (
    <HStack
      as="span"
      display="inline-flex"
      gap="4px"
      minH="18px"
      px="9px"
      py="2px"
      borderRadius="999px"
      bg={colors.bg}
      color={colors.color}
      fontSize="10px"
      fontWeight="500"
      lineHeight="1"
      whiteSpace="nowrap"
    >
      {icon}
      <Box as="span">{children}</Box>
    </HStack>
  );
}

function StatCard({
  accent,
  label,
  value,
  caption,
}: {
  accent: string;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <Box
      p="14px 16px"
      border="1px solid"
      borderColor="border"
      borderLeft="3px solid"
      borderLeftColor={accent}
      borderRadius="10px"
      bg="bg"
    >
      <Text
        m="0"
        fontSize="10px"
        fontWeight="600"
        letterSpacing="0.04em"
        textTransform="uppercase"
        color="fg.muted"
      >
        {label}
      </Text>
      <Text m="6px 0 0" fontSize="18px" fontWeight="700" color="fg">
        {value}
      </Text>
      <Text m="4px 0 0" fontSize="11px" color="fg.muted">
        {caption}
      </Text>
    </Box>
  );
}

function SummaryRow({
  label,
  value,
  valueColor,
  bold,
}: {
  label: string;
  value: ReactNode;
  valueColor?: string;
  bold?: boolean;
}) {
  return (
    <HStack
      justify="space-between"
      gap="12px"
      py="7px"
      borderBottom="1px solid"
      borderColor="border.subtle"
      _last={{ borderBottom: 0 }}
    >
      <Text m="0" fontSize="13px" color="fg.muted">
        {label}
      </Text>
      <Text
        m="0"
        fontSize="13px"
        fontWeight={bold ? "700" : "500"}
        color={valueColor ?? "fg"}
        textAlign="right"
      >
        {value}
      </Text>
    </HStack>
  );
}

// ── Wizard ────────────────────────────────────────────────────────────────────

// Resolves the practice-area name first (skeleton meanwhile) so the cost
// presets can be baked into the form's defaultValues — a late async reset would
// clobber user input.
export function FeeAgreementWizard({
  lead,
  consultationFeeAmount,
  generating,
  initialDetails,
  onSubmit,
}: {
  // Only the fields needed to resolve cost presets / the contingency fit tag,
  // so slimmer lead projections can be passed too.
  lead: Pick<Lead, "practiceAreaId" | "caseTypeName">;
  consultationFeeAmount: number | null;
  generating: boolean;
  // Stored config of a discarded draft — seeds the wizard for regeneration.
  initialDetails?: FeeAgreementDetails | null;
  onSubmit: (data: GenerateFeeAgreementInput) => void;
}) {
  const { data: practiceAreas, isLoading } = useFirmPracticeAreas();
  if (isLoading) {
    return (
      <Stack gap="10px">
        <Skeleton h="24px" w="60%" borderRadius="6px" />
        <Skeleton h="140px" w="100%" borderRadius="10px" />
      </Stack>
    );
  }
  const practiceAreaName =
    practiceAreas?.find((a) => a.id === lead.practiceAreaId)?.name ??
    lead.caseTypeName ??
    null;
  return (
    <WizardFormBody
      practiceAreaName={practiceAreaName}
      consultationFeeAmount={consultationFeeAmount}
      generating={generating}
      initialDetails={initialDetails ?? null}
      onSubmit={onSubmit}
    />
  );
}

function WizardFormBody({
  practiceAreaName,
  consultationFeeAmount,
  generating,
  initialDetails,
  onSubmit,
}: {
  practiceAreaName: string | null;
  consultationFeeAmount: number | null;
  generating: boolean;
  initialDetails: FeeAgreementDetails | null;
  onSubmit: (data: GenerateFeeAgreementInput) => void;
}) {
  const preset = getCostPreset(practiceAreaName);
  const contingencyFit = getContingencyFit(practiceAreaName);

  const [step, setStep] = useState(0);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<WizardForm>({
    resolver: zodResolver(wizardSchema),
    defaultValues: initialDetails
      ? detailsToFormValues(initialDetails, preset)
      : emptyFormValues(preset),
    mode: "onChange",
  });

  const govFieldArray = useFieldArray({ control, name: "governmentFees" });
  const otherFieldArray = useFieldArray({ control, name: "otherCosts" });

  const w = useWatch({ control });
  const feeType = w.feeType ?? null;
  const isContingency = feeType === "contingency";

  // Upfront attorney fee: hourly is billed later and contingency is paid from
  // the recovery, so both are $0 at signing (document totalDue semantics).
  const attorneyUpfront =
    feeType === "flat" || feeType === "flat_hourly"
      ? Number(w.flatRate || 0)
      : 0;
  const hourlyEstimate =
    Number(w.hourlyRate || 0) * Number(w.estimatedHours || 0);
  const govTotal = (w.governmentFees ?? []).reduce(
    (sum, g) => sum + Number(g?.amount || 0),
    0,
  );
  const otherTotal = (w.otherCosts ?? []).reduce(
    (sum, c) => sum + (c?.included ? Number(c?.amount || 0) : 0),
    0,
  );
  const operatingTotal = attorneyUpfront + otherTotal;
  const creditAmount = w.applyConsultationCredit
    ? (consultationFeeAmount ?? 0)
    : 0;
  // The credit only offsets attorney fees — it can't reduce costs below zero.
  const totalCommitment =
    Math.max(attorneyUpfront - creditAmount, 0) + govTotal + otherTotal;

  const contingencyPct = Number(w.contingencyPercent || 0);
  const coversLabel = [
    "Attorney fees",
    ...(w.coversCaseCosts ? ["Case costs & disbursements"] : []),
    ...(w.coversExpertWitness ? ["Expert witness fees"] : []),
  ].join(", ");
  const abaAllChecked = Boolean(
    w.abaCompliance && w.abaFeeMethod && w.abaAlternatives,
  );

  // Settlement example (illustration only — never submitted).
  const [exampleGross, setExampleGross] = useState("100000");
  const exGross = Number(exampleGross || 0);
  const exFee = (exGross * contingencyPct) / 100;
  const exCosts = govTotal + otherTotal;
  const exClient = exGross - exFee - exCosts;

  const instTotal = Number(w.instMonthly || 0) * Number(w.instCount || 0);

  const next = async () => {
    const ok = await trigger(STEP_FIELDS[step]);
    if (ok) setStep((s) => s + 1);
  };

  const splitEvenly = () => {
    const half = (totalCommitment / 2).toFixed(2);
    setValue("twoPayFirst", half, { shouldValidate: true });
    setValue("twoPaySecond", half, { shouldValidate: true });
  };

  const onValid = (data: WizardForm) => {
    if (!data.feeType) return;
    const isCont = data.feeType === "contingency";
    const upfront =
      data.feeType === "flat" || data.feeType === "flat_hourly"
        ? Number(data.flatRate || 0)
        : 0;
    const includedOther = data.otherCosts.filter((c) => c.included);
    const gov = data.governmentFees.map((g) => ({
      name: g.name.trim(),
      amount: Number(g.amount || 0),
    }));
    const other = includedOther.map((c) => ({
      name: c.name.trim(),
      amount: Number(c.amount || 0),
    }));
    onSubmit({
      attorneyFee: {
        type: data.feeType,
        flatRate:
          data.feeType === "flat" || data.feeType === "flat_hourly"
            ? Number(data.flatRate || 0)
            : undefined,
        hourlyRate:
          data.feeType === "hourly" || data.feeType === "flat_hourly"
            ? Number(data.hourlyRate || 0)
            : undefined,
        estimatedHours:
          data.feeType === "hourly" ? Number(data.estimatedHours || 0) : undefined,
        contingencyPercent: isCont
          ? Number(data.contingencyPercent)
          : undefined,
      },
      contingencyTerms: isCont
        ? {
            coversCaseCosts: data.coversCaseCosts,
            coversExpertWitnessFees: data.coversExpertWitness,
            ifLost: data.ifLost,
            abaConfirmed: true,
          }
        : undefined,
      governmentFees: gov,
      otherCosts: other.length ? other : undefined,
      // Under a contingency arrangement the firm advances all costs; standard
      // agreements keep the client-pays-upfront default.
      governmentFeesPaidBy: isCont ? "firm_advanced" : "client_upfront",
      paymentPlan: isCont ? undefined : data.paymentPlan,
      twoPaymentsSchedule:
        !isCont && data.paymentPlan === "two_payments"
          ? {
              firstAmount: Number(data.twoPayFirst),
              secondAmount: Number(data.twoPaySecond),
              secondDueDate: data.twoPaySecondDate,
            }
          : undefined,
      installmentSchedule:
        !isCont && data.paymentPlan === "installments"
          ? {
              monthlyAmount: Number(data.instMonthly),
              numberOfPayments: Number(data.instCount),
              firstPaymentDate: data.instFirstDate,
            }
          : undefined,
      paymentAllocation: isCont
        ? undefined
        : {
            order: data.allocationOrder,
            customFeePercent:
              data.allocationOrder === "custom"
                ? Number(data.customFeePercent)
                : undefined,
          },
      applyConsultationCredit: data.applyConsultationCredit,
      accountSplit: isCont
        ? undefined
        : {
            operating: upfront + other.reduce((s, c) => s + c.amount, 0),
            trust: gov.reduce((s, g) => s + g.amount, 0),
          },
    });
  };

  return (
    <chakra.form
      onSubmit={(e) => {
        // Native submission is never used: none of the footer buttons are
        // type="submit" (React reuses the same DOM node across steps, so a
        // submit-type Generate button would receive the click's default
        // action when "Next" morphs into it and auto-generate). This handler
        // only serves the Enter key.
        e.preventDefault();
        if (step === 2) void handleSubmit(onValid)();
        else void next();
      }}
    >
      <Stack gap="16px">
        <WizardStepIndicator step={step} />

        {/* ── Step 1: Fee structure ─────────────────────────────────────── */}
        {step === 0 ? (
          <Stack gap="16px">
            <Box>
              <MicroLabel>Attorney fee type</MicroLabel>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap="10px">
                {FEE_TYPE_CARDS.map((card) => (
                  <SelectableCard
                    key={card.value}
                    selected={feeType === card.value}
                    onClick={() =>
                      setValue("feeType", card.value, { shouldValidate: true })
                    }
                  >
                    <Stack gap="8px" align="flex-start">
                      <Box
                        display="grid"
                        placeItems="center"
                        w="32px"
                        h="32px"
                        borderRadius="9px"
                        bg={card.iconBg}
                        color={card.iconColor}
                      >
                        {card.icon}
                      </Box>
                      <Box>
                        <Text m="0" fontSize="13px" fontWeight="600" color="fg">
                          {card.title}
                        </Text>
                        <Text m="2px 0 0" fontSize="12px" color="fg.muted">
                          {card.description}
                        </Text>
                      </Box>
                      {card.value === "contingency" ? (
                        <Box
                          as="span"
                          px="8px"
                          py="3px"
                          borderRadius="999px"
                          bg={FIT_TONES[contingencyFit.tone].bg}
                          color={FIT_TONES[contingencyFit.tone].color}
                          fontSize="10px"
                          fontWeight="500"
                          lineHeight="1"
                        >
                          {contingencyFit.label}
                        </Box>
                      ) : null}
                    </Stack>
                  </SelectableCard>
                ))}
              </SimpleGrid>
              <FieldError msg={errors.feeType?.message} />
            </Box>

            {feeType === "flat" ? (
              <Box>
                <MicroLabel>Total attorney fee</MicroLabel>
                <HStack gap="6px">
                  <Text fontSize="14px" color="fg.muted">
                    $
                  </Text>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="0.00"
                    maxW="160px"
                    {...fieldStyles}
                    {...register("flatRate")}
                  />
                  <MutedText>total</MutedText>
                </HStack>
                <HStack gap="4px" mt="6px" color="fg.muted">
                  <Lock size={11} />
                  <MutedText>Operating account</MutedText>
                </HStack>
                <FieldError msg={errors.flatRate?.message} />
              </Box>
            ) : null}

            {feeType === "hourly" ? (
              <Stack gap="12px">
                <Box>
                  <MicroLabel>Hourly rate</MicroLabel>
                  <HStack gap="6px">
                    <Text fontSize="14px" color="fg.muted">
                      $
                    </Text>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      maxW="140px"
                      {...fieldStyles}
                      {...register("hourlyRate")}
                    />
                    <MutedText>/ hour</MutedText>
                  </HStack>
                  <FieldError msg={errors.hourlyRate?.message} />
                </Box>
                <Box>
                  <MicroLabel>Estimated hours</MicroLabel>
                  <HStack gap="6px">
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      placeholder="0"
                      maxW="110px"
                      {...fieldStyles}
                      {...register("estimatedHours")}
                    />
                    <MutedText>hours</MutedText>
                  </HStack>
                  <FieldError msg={errors.estimatedHours?.message} />
                </Box>
                <HStack
                  justify="space-between"
                  p="10px 14px"
                  borderRadius="8px"
                  bg="bg.subtle"
                >
                  <Text m="0" fontSize="12px" color="fg.muted">
                    Estimated total:
                  </Text>
                  <Text m="0" fontSize="13px" fontWeight="700" color="fg">
                    {fmtMoney(hourlyEstimate)}
                  </Text>
                </HStack>
                <MutedText>Final amount billed based on actual hours</MutedText>
              </Stack>
            ) : null}

            {feeType === "flat_hourly" ? (
              <Stack gap="12px">
                <Box>
                  <MicroLabel>Initial retainer</MicroLabel>
                  <HStack gap="6px">
                    <Text fontSize="14px" color="fg.muted">
                      $
                    </Text>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      maxW="160px"
                      {...fieldStyles}
                      {...register("flatRate")}
                    />
                    <MutedText>due at signing</MutedText>
                  </HStack>
                  <FieldError msg={errors.flatRate?.message} />
                </Box>
                <Box>
                  <MicroLabel>Hourly rate thereafter</MicroLabel>
                  <HStack gap="6px">
                    <Text fontSize="14px" color="fg.muted">
                      $
                    </Text>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      placeholder="0.00"
                      maxW="140px"
                      {...fieldStyles}
                      {...register("hourlyRate")}
                    />
                    <MutedText>/ hour</MutedText>
                  </HStack>
                  <FieldError msg={errors.hourlyRate?.message} />
                </Box>
                <Box p="10px 14px" borderRadius="8px" bg="bg.subtle">
                  <Text m="0" fontSize="12px" color="fg.muted">
                    Retainer is due at signing. Additional hours are billed
                    monthly against the retainer balance.
                  </Text>
                </Box>
              </Stack>
            ) : null}

            {isContingency ? (
              <Stack gap="14px">
                <HStack
                  align="flex-start"
                  gap="8px"
                  p="12px 16px"
                  borderRadius="10px"
                  bg="#d9f8ed"
                  border="1px solid"
                  borderColor="#9fdcc6"
                >
                  <Box color="#00785a" mt="2px">
                    <Check size={14} />
                  </Box>
                  <Box>
                    <Text m="0" fontSize="13px" fontWeight="600" color="#00785a">
                      $0 due from client at signing
                    </Text>
                    <Text m="2px 0 0" fontSize="12px" color="#00785a">
                      The client pays nothing upfront. The firm's fee is taken
                      from the recovery when the case resolves.
                    </Text>
                  </Box>
                </HStack>

                <Box>
                  <Text m="0" fontSize="13px" fontWeight="600" color="fg">
                    Contingency percentage
                  </Text>
                  <MutedText>
                    The firm takes this percentage of the gross settlement,
                    judgment, or award obtained.
                  </MutedText>
                  <HStack gap="6px" mt="8px">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.1"
                      placeholder="0"
                      maxW="100px"
                      {...fieldStyles}
                      {...register("contingencyPercent")}
                    />
                    <Text fontSize="14px" color="fg.muted">
                      %
                    </Text>
                    <MutedText>of gross settlement or judgment</MutedText>
                  </HStack>
                  <HStack gap="8px" mt="8px" align="center">
                    <MutedText>Common rates:</MutedText>
                    {["33.3", "40", "25"].map((rate) => (
                      <ChoiceChip
                        key={rate}
                        active={w.contingencyPercent === rate}
                        onClick={() =>
                          setValue("contingencyPercent", rate, {
                            shouldValidate: true,
                          })
                        }
                      >
                        {rate}%
                      </ChoiceChip>
                    ))}
                  </HStack>
                  <FieldError msg={errors.contingencyPercent?.message} />
                </Box>

                <Box>
                  <Text m="0 0 8px" fontSize="13px" fontWeight="600" color="fg">
                    What this percentage covers
                  </Text>
                  <Stack gap="8px">
                    <CheckRow
                      checked
                      disabled
                      locked
                      onToggle={() => undefined}
                      title="Attorney fees"
                      description="Always included — required"
                    />
                    <CheckRow
                      checked={Boolean(w.coversCaseCosts)}
                      onToggle={() =>
                        setValue("coversCaseCosts", !w.coversCaseCosts)
                      }
                      title="Case costs & disbursements"
                      description="Filing fees, medical records, court costs advanced by the firm"
                    />
                    <CheckRow
                      checked={Boolean(w.coversExpertWitness)}
                      onToggle={() =>
                        setValue("coversExpertWitness", !w.coversExpertWitness)
                      }
                      title="Expert witness fees"
                      description="If expert testimony is required"
                    />
                  </Stack>
                </Box>

                <Box>
                  <Text m="0 0 8px" fontSize="13px" fontWeight="600" color="fg">
                    If the case is lost or no recovery is obtained
                  </Text>
                  <Stack gap="8px">
                    <RadioRow
                      selected={w.ifLost === "client_owes_nothing"}
                      onSelect={() => setValue("ifLost", "client_owes_nothing")}
                      title="Client owes nothing"
                      description="The firm absorbs all costs and fees. Zero financial obligation for the client."
                    />
                    <RadioRow
                      selected={w.ifLost === "client_reimburses_hard_costs"}
                      onSelect={() =>
                        setValue("ifLost", "client_reimburses_hard_costs")
                      }
                      title="Client reimburses hard costs only"
                      description="No attorney fees owed, but client reimburses actual out-of-pocket costs the firm advanced."
                    />
                  </Stack>
                </Box>

                <HStack
                  align="flex-start"
                  gap="8px"
                  p="12px 16px"
                  borderRadius="10px"
                  bg="#fbefd8"
                  border="1px solid"
                  borderColor="#ecd9ae"
                >
                  <Box color="#8a641d" mt="2px">
                    <Scale size={14} />
                  </Box>
                  <Box>
                    <Text m="0" fontSize="12px" fontWeight="600" color="#8a641d">
                      ABA Rule 1.5(c) — Required compliance
                    </Text>
                    <Text m="2px 0 0" fontSize="12px" color="#8a641d">
                      Contingency fee agreements must be in writing, signed by
                      the client before any work begins, and must state the
                      method for determining the fee including the percentage
                      and what expenses are deducted before or after the fee is
                      calculated.
                    </Text>
                  </Box>
                </HStack>
              </Stack>
            ) : null}
          </Stack>
        ) : null}

        {/* ── Step 2: Costs ─────────────────────────────────────────────── */}
        {step === 1 ? (
          <Stack gap="16px">
            <Box>
              <Text m="0" fontSize="13px" fontWeight="600" color="fg">
                {isContingency ? "Advanced case costs" : "Costs & disbursements"}
              </Text>
              <MutedText>
                {isContingency
                  ? "These costs will be advanced by the firm and deducted from the settlement."
                  : "Add all costs associated with this matter. Pre-populated based on practice area — add or remove as needed."}
              </MutedText>
            </Box>

            {!isContingency ? (
              <HStack
                align="flex-start"
                gap="8px"
                p="10px 14px"
                borderRadius="8px"
                bg="bg.subtle"
                color="fg.muted"
              >
                <Box mt="2px">
                  <Info size={12} />
                </Box>
                <MutedText>
                  Government &amp; court fees go to the trust account (IOLTA).
                  Other costs go to the operating account. Attorney fees go to
                  the operating account.
                </MutedText>
              </HStack>
            ) : null}

            {/* Government fees */}
            <Box>
              <HStack justify="space-between" gap="12px" mb="8px" wrap="wrap">
                <Text m="0" fontSize="13px" fontWeight="600" color="fg">
                  {isContingency
                    ? "Court & government fees"
                    : "Government & filing fees"}
                </Text>
                <SectionTag tone="trust" icon={<Lock size={10} />}>
                  Trust account (IOLTA)
                </SectionTag>
              </HStack>
              <Stack gap="8px">
                {govFieldArray.fields.map((f, i) => (
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
                      onClick={() => govFieldArray.remove(i)}
                      display="grid"
                      placeItems="center"
                      w="32px"
                      h="32px"
                      flex="0 0 auto"
                      borderRadius="7px"
                      color="fg.muted"
                      _hover={{ bg: "bg.muted" }}
                    >
                      <Trash2 size={14} />
                    </chakra.button>
                  </HStack>
                ))}
              </Stack>
              <chakra.button
                type="button"
                onClick={() => govFieldArray.append({ name: "", amount: "" })}
                mt="8px"
                display="inline-flex"
                alignItems="center"
                gap="4px"
                fontSize="12px"
                fontWeight="500"
                color="fg.muted"
                border="1px dashed"
                borderColor="border"
                borderRadius="7px"
                px="10px"
                h="30px"
                _hover={{ bg: "bg.muted" }}
              >
                <Plus size={13} />
                Add government fee
              </chakra.button>
            </Box>

            {/* Other costs */}
            <Box>
              <HStack justify="space-between" gap="12px" mb="8px" wrap="wrap">
                <Text m="0" fontSize="13px" fontWeight="600" color="fg">
                  {isContingency
                    ? "Expert & other costs"
                    : "Other costs & disbursements"}
                </Text>
                <SectionTag tone="operating">Operating account</SectionTag>
              </HStack>
              <Stack gap="8px">
                {otherFieldArray.fields.map((f, i) => {
                  const included = Boolean(w.otherCosts?.[i]?.included);
                  return (
                    <HStack key={f.id} gap="8px" opacity={included ? 1 : 0.65}>
                      <CheckOption
                        checked={included}
                        onToggle={() =>
                          setValue(`otherCosts.${i}.included` as const, !included)
                        }
                        label=""
                      />
                      <Input
                        placeholder="Cost name (e.g. Translation services)"
                        {...fieldStyles}
                        {...register(`otherCosts.${i}.name` as const)}
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
                          {...register(`otherCosts.${i}.amount` as const)}
                        />
                      </HStack>
                      <chakra.button
                        type="button"
                        aria-label="Remove cost"
                        onClick={() => otherFieldArray.remove(i)}
                        display="grid"
                        placeItems="center"
                        w="32px"
                        h="32px"
                        flex="0 0 auto"
                        borderRadius="7px"
                        color="fg.muted"
                        _hover={{ bg: "bg.muted" }}
                      >
                        <Trash2 size={14} />
                      </chakra.button>
                    </HStack>
                  );
                })}
              </Stack>
              <chakra.button
                type="button"
                onClick={() =>
                  otherFieldArray.append({
                    included: true,
                    name: "",
                    amount: "",
                  })
                }
                mt="8px"
                display="inline-flex"
                alignItems="center"
                gap="4px"
                fontSize="12px"
                fontWeight="500"
                color="fg.muted"
                border="1px dashed"
                borderColor="border"
                borderRadius="7px"
                px="10px"
                h="30px"
                _hover={{ bg: "bg.muted" }}
              >
                <Plus size={13} />
                Add custom cost
              </chakra.button>
            </Box>

            {/* Cost summary */}
            <SimpleGrid columns={{ base: 1, md: 3 }} gap="10px">
              <StatCard
                accent="#00785a"
                label={isContingency ? "Costs advanced" : "Operating account"}
                value={fmtMoney(isContingency ? 0 : operatingTotal)}
                caption={
                  isContingency
                    ? "Deducted from recovery"
                    : "Attorney fees + disbursements"
                }
              />
              <StatCard
                accent="#534AB7"
                label="Trust account (IOLTA)"
                value={fmtMoney(govTotal)}
                caption="Government & filing fees"
              />
              <StatCard
                accent="#b8860b"
                label="Total client commitment"
                value={fmtMoney(isContingency ? govTotal + otherTotal : totalCommitment)}
                caption="All fees and costs combined"
              />
            </SimpleGrid>

            {isContingency ? (
              <HStack
                align="flex-start"
                gap="8px"
                p="12px 16px"
                borderRadius="10px"
                bg="#ffe2e4"
                border="1px solid"
                borderColor="#f3bcc1"
              >
                <Box color="#b00020" mt="2px">
                  <TrendingUp size={14} />
                </Box>
                <Box>
                  <Text m="0" fontSize="12px" fontWeight="600" color="#b00020">
                    Revenue recognized on case resolution
                  </Text>
                  <Text m="2px 0 0" fontSize="12px" color="#b00020">
                    Attorney fees are not recorded until the case closes and a
                    settlement or judgment is obtained. Only advanced costs are
                    tracked during the case.
                  </Text>
                </Box>
              </HStack>
            ) : null}
          </Stack>
        ) : null}

        {/* ── Step 3 (standard): Payment plan & allocation ─────────────── */}
        {step === 2 && !isContingency ? (
          <Stack gap="16px">
            <Box>
              <Text m="0" fontSize="13px" fontWeight="600" color="fg">
                Payment plan &amp; allocation
              </Text>
              <MutedText>
                How the client will pay and how funds are allocated between fees
                and costs.
              </MutedText>
            </Box>

            <Box>
              <MicroLabel>Payment structure</MicroLabel>
              <Stack gap="8px">
                <RadioRow
                  selected={w.paymentPlan === "pay_in_full"}
                  onSelect={() => setValue("paymentPlan", "pay_in_full")}
                  title="Pay in full"
                  description="Full amount due at signing"
                />
                <RadioRow
                  selected={w.paymentPlan === "two_payments"}
                  onSelect={() => setValue("paymentPlan", "two_payments")}
                  title="Two payments"
                  description="Split into two scheduled payments"
                >
                  <Stack gap="8px" mt="4px">
                    <HStack gap="8px" wrap="wrap">
                      <Text m="0" fontSize="12px" color="fg.muted" w="76px">
                        Payment 1
                      </Text>
                      <HStack gap="4px">
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
                          {...register("twoPayFirst")}
                        />
                      </HStack>
                      <MutedText>due at signing</MutedText>
                    </HStack>
                    <FieldError msg={errors.twoPayFirst?.message} />
                    <HStack gap="8px" wrap="wrap">
                      <Text m="0" fontSize="12px" color="fg.muted" w="76px">
                        Payment 2
                      </Text>
                      <HStack gap="4px">
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
                          {...register("twoPaySecond")}
                        />
                      </HStack>
                      <MutedText>due on</MutedText>
                      <Input
                        type="date"
                        maxW="170px"
                        {...fieldStyles}
                        {...register("twoPaySecondDate")}
                      />
                    </HStack>
                    <FieldError
                      msg={
                        errors.twoPaySecond?.message ??
                        errors.twoPaySecondDate?.message
                      }
                    />
                    <Box>
                      <OutlineButton onClick={splitEvenly}>
                        <Divide size={13} />
                        Split evenly
                      </OutlineButton>
                    </Box>
                  </Stack>
                </RadioRow>
                <RadioRow
                  selected={w.paymentPlan === "installments"}
                  onSelect={() => setValue("paymentPlan", "installments")}
                  title="Instalment plan"
                  description="Regular monthly payments"
                >
                  <Stack gap="8px" mt="4px">
                    <HStack gap="8px" wrap="wrap">
                      <Text m="0" fontSize="12px" color="fg.muted" w="110px">
                        Monthly amount
                      </Text>
                      <HStack gap="4px">
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
                          {...register("instMonthly")}
                        />
                      </HStack>
                      <MutedText>per month</MutedText>
                    </HStack>
                    <FieldError msg={errors.instMonthly?.message} />
                    <HStack gap="8px" wrap="wrap">
                      <Text m="0" fontSize="12px" color="fg.muted" w="110px">
                        No. of payments
                      </Text>
                      <Input
                        type="number"
                        min={2}
                        step="1"
                        maxW="90px"
                        {...fieldStyles}
                        {...register("instCount")}
                      />
                      <MutedText>payments</MutedText>
                    </HStack>
                    <FieldError msg={errors.instCount?.message} />
                    <HStack gap="8px" wrap="wrap">
                      <Text m="0" fontSize="12px" color="fg.muted" w="110px">
                        First payment
                      </Text>
                      <Input
                        type="date"
                        maxW="170px"
                        {...fieldStyles}
                        {...register("instFirstDate")}
                      />
                    </HStack>
                    <FieldError msg={errors.instFirstDate?.message} />
                    <HStack
                      justify="space-between"
                      p="8px 12px"
                      borderRadius="8px"
                      bg="bg.subtle"
                    >
                      <Text m="0" fontSize="12px" color="fg.muted">
                        Estimated total:
                      </Text>
                      <Text m="0" fontSize="13px" fontWeight="700" color="fg">
                        {fmtMoney(instTotal)}
                      </Text>
                    </HStack>
                  </Stack>
                </RadioRow>
              </Stack>
            </Box>

            <Box>
              <MicroLabel>Payment allocation</MicroLabel>
              <MutedText>
                Set how each payment is distributed between attorney fees and
                costs.
              </MutedText>
              <Stack gap="8px" mt="8px">
                <RadioRow
                  selected={w.allocationOrder === "fees_first"}
                  onSelect={() => setValue("allocationOrder", "fees_first")}
                  title="Attorney fees paid first, then costs applied"
                />
                <RadioRow
                  selected={w.allocationOrder === "costs_first"}
                  onSelect={() => setValue("allocationOrder", "costs_first")}
                  title="Costs paid first, then attorney fees applied"
                />
                <RadioRow
                  selected={w.allocationOrder === "custom"}
                  onSelect={() => setValue("allocationOrder", "custom")}
                  title="Custom split — set your own percentage"
                >
                  <Stack gap="6px" mt="4px">
                    <HStack gap="8px" wrap="wrap">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="1"
                        maxW="80px"
                        {...fieldStyles}
                        {...register("customFeePercent")}
                      />
                      <Text m="0" fontSize="13px" color="fg">
                        % attorney fees
                      </Text>
                      <Text m="0" fontSize="13px" color="fg.muted">
                        +
                      </Text>
                      <Text m="0" fontSize="13px" fontWeight="600" color="fg">
                        {Math.max(0, 100 - Number(w.customFeePercent || 0))}%
                      </Text>
                      <Text m="0" fontSize="13px" color="fg.muted">
                        costs
                      </Text>
                    </HStack>
                    <FieldError msg={errors.customFeePercent?.message} />
                  </Stack>
                </RadioRow>
              </Stack>
            </Box>

            <Box
              p="12px 16px"
              borderRadius="10px"
              bg="#faf3dc"
              border="1px solid"
              borderColor="#ecd9ae"
            >
              <CheckOption
                checked={Boolean(w.applyConsultationCredit)}
                onToggle={() =>
                  setValue(
                    "applyConsultationCredit",
                    !w.applyConsultationCredit,
                  )
                }
                label={
                  <>
                    <chakra.span display="block" fontWeight="600">
                      Apply consultation fee credit
                    </chakra.span>
                    <chakra.span
                      display="block"
                      fontSize="12px"
                      color="fg.muted"
                    >
                      Consultation fee
                      {consultationFeeAmount != null
                        ? ` ($${consultationFeeAmount})`
                        : ""}{" "}
                      applied as credit toward attorney fees
                    </chakra.span>
                  </>
                }
              />
            </Box>

            <Box p="16px" borderRadius="10px" bg="bg.subtle">
              <MicroLabel>Agreement summary</MicroLabel>
              <SummaryRow
                label="Fee type"
                value={feeType ? FEE_TYPE_LABELS[feeType] : "—"}
              />
              <SummaryRow
                label="Attorney fees"
                value={fmtMoney(attorneyUpfront)}
              />
              <SummaryRow
                label="Government fees"
                value={`${fmtMoney(govTotal)} → Trust`}
              />
              <SummaryRow
                label="Other costs"
                value={`${fmtMoney(otherTotal)} → Operating`}
              />
              {w.applyConsultationCredit && consultationFeeAmount != null ? (
                <SummaryRow
                  label="Consultation credit"
                  value={`−${fmtMoney(consultationFeeAmount)}`}
                  valueColor="#00785a"
                />
              ) : null}
              <SummaryRow
                label="Payment plan"
                value={PAYMENT_PLAN_LABELS[w.paymentPlan ?? "pay_in_full"]}
              />
              <SummaryRow
                label="Total commitment"
                value={fmtMoney(totalCommitment)}
                bold
              />
              <HStack gap="6px" mt="10px" align="flex-start" color="#534AB7">
                <Shield size={12} />
                <Text m="0" fontSize="11px" color="fg.muted">
                  Trust account funds are held in compliance with ABA Rule 1.15
                  (IOLTA). These funds are client property and are never
                  commingled with operating account funds.
                </Text>
              </HStack>
            </Box>
          </Stack>
        ) : null}

        {/* ── Step 3 (contingency): Review & sign ──────────────────────── */}
        {step === 2 && isContingency ? (
          <Stack gap="16px">
            <Box>
              <Text m="0" fontSize="13px" fontWeight="600" color="fg">
                Review &amp; sign
              </Text>
              <MutedText>
                Confirm the contingency terms, review the settlement example,
                and confirm ABA compliance before generating the agreement.
              </MutedText>
            </Box>

            <Box p="16px" borderRadius="10px" bg="bg.subtle">
              <MicroLabel>Contingency terms (from step 1)</MicroLabel>
              <SummaryRow label="Percentage" value={`${contingencyPct}%`} />
              <SummaryRow label="Covers" value={coversLabel} />
              <SummaryRow
                label="If case is lost"
                value={IF_LOST_LABELS[w.ifLost ?? "client_owes_nothing"]}
              />
            </Box>

            <Box>
              <MicroLabel>Settlement example</MicroLabel>
              <Box border="1px solid" borderColor="border" borderRadius="10px">
                <HStack justify="space-between" gap="12px" p="12px 16px">
                  <Text m="0" fontSize="13px" color="fg">
                    Hypothetical gross settlement
                  </Text>
                  <HStack gap="4px">
                    <Text fontSize="14px" color="fg.muted">
                      $
                    </Text>
                    <Input
                      type="number"
                      min={0}
                      step="1000"
                      maxW="130px"
                      textAlign="right"
                      value={exampleGross}
                      onChange={(e) => setExampleGross(e.currentTarget.value)}
                      {...fieldStyles}
                    />
                  </HStack>
                </HStack>
                <Box borderTop="1px solid" borderColor="border.subtle" px="16px">
                  <SummaryRow
                    label="Gross settlement / judgment"
                    value={fmtMoney(exGross)}
                  />
                  <SummaryRow
                    label={`Attorney fee (${contingencyPct}%)`}
                    value={`− ${fmtMoney(exFee)}`}
                    valueColor="#00785a"
                  />
                  <SummaryRow
                    label="Costs & disbursements"
                    value={`− ${fmtMoney(exCosts)}`}
                    valueColor="#00785a"
                  />
                  <SummaryRow
                    label="Client receives"
                    value={fmtMoney(exClient)}
                    bold
                  />
                </Box>
              </Box>
              <MutedText>
                This is for illustration only. Actual settlement amounts will
                vary.
              </MutedText>
            </Box>

            <Box>
              <MicroLabel>Attorney confirmations (ABA Rule 1.5(c))</MicroLabel>
              <Stack gap="8px">
                <CheckRow
                  checked={Boolean(w.abaCompliance)}
                  onToggle={() => setValue("abaCompliance", !w.abaCompliance)}
                  title="I confirm this contingency arrangement complies with ABA Rule 1.5(c) and is appropriate for this matter."
                />
                <CheckRow
                  checked={Boolean(w.abaFeeMethod)}
                  onToggle={() => setValue("abaFeeMethod", !w.abaFeeMethod)}
                  title="The agreement clearly states the method for determining the fee, including litigation and post-judgment collection expenses."
                />
                <CheckRow
                  checked={Boolean(w.abaAlternatives)}
                  onToggle={() =>
                    setValue("abaAlternatives", !w.abaAlternatives)
                  }
                  title="I confirm the client has been advised of alternative billing arrangements and has chosen this contingency structure."
                />
              </Stack>
            </Box>

            <Box p="16px" borderRadius="10px" bg="bg.subtle">
              <MicroLabel>Agreement summary</MicroLabel>
              <SummaryRow label="Fee type" value="Contingency" />
              <SummaryRow label="Percentage" value={`${contingencyPct}%`} />
              <SummaryRow label="Covers" value={coversLabel} />
              <SummaryRow
                label="If lost"
                value={IF_LOST_LABELS[w.ifLost ?? "client_owes_nothing"]}
              />
              <HStack gap="6px" mt="10px" align="flex-start" color="#534AB7">
                <Shield size={12} />
                <Text m="0" fontSize="11px" color="fg.muted">
                  Contingency agreements are governed by ABA Rule 1.5(c). The
                  signed agreement will be stored in the client file.
                </Text>
              </HStack>
            </Box>
          </Stack>
        ) : null}

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <HStack justify={step === 0 ? "flex-end" : "space-between"}>
          {step > 0 ? (
            <OutlineButton onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft size={14} />
              Back
            </OutlineButton>
          ) : null}
          {step === 0 ? (
            <BrandButton type="button" onClick={() => void next()}>
              Next: Add costs
              <ArrowRight size={14} />
            </BrandButton>
          ) : step === 1 ? (
            <BrandButton type="button" onClick={() => void next()}>
              Next: Payment plan
              <ArrowRight size={14} />
            </BrandButton>
          ) : (
            <BrandButton
              type="button"
              loading={generating}
              disabled={isContingency && !abaAllChecked}
              onClick={() => void handleSubmit(onValid)()}
            >
              <FileText size={14} />
              Generate fee agreement
            </BrandButton>
          )}
        </HStack>
      </Stack>
    </chakra.form>
  );
}
