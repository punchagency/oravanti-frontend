import type {
  ConsultationBalanceDueMode,
  ConsultationFeeSchedule,
  ConsultationNoShowPolicy,
} from "@/api/consultation-settings";
import {
  useConsultationSettings,
  useUpdateConsultationSettings,
} from "@/hooks/use-consultation-settings";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import { Box, Button, Flex, Input, Stack, Text, chakra } from "@chakra-ui/react";
import { useEffect, useState } from "react";

/**
 * When the consultation fee is collected, and what happens when nobody turns
 * up.
 *
 * Two cards rather than one: they answer different questions and a firm
 * changing its no-show stance has no reason to re-read its deposit terms.
 *
 * Every option spells out its consequence. A firm choosing "the client decides"
 * over "refund automatically" is choosing who chases the money, and a label
 * alone does not say that.
 */

type ScheduleOption = {
  value: ConsultationFeeSchedule;
  label: string;
  detail: string;
};

const SCHEDULE_OPTIONS: ScheduleOption[] = [
  {
    value: "full_upfront",
    label: "Paid in full before the consultation",
    detail:
      "The invoice is due immediately and the client cannot pick a time until it is settled.",
  },
  {
    value: "partial_upfront",
    label: "Deposit upfront, balance afterwards",
    detail:
      "The deposit unlocks booking. The balance is a second instalment on the same invoice, and the client is emailed a payment link for it after the consultation.",
  },
  {
    value: "after_consultation",
    label: "Paid after the consultation",
    detail:
      "The client books freely and is emailed the invoice once the consultation is marked complete.",
  },
];

type BalanceModeOption = {
  value: ConsultationBalanceDueMode;
  label: string;
  detail: string;
};

const BALANCE_MODE_OPTIONS: BalanceModeOption[] = [
  {
    value: "fixed",
    label: "Same for every consultation",
    detail:
      "Every deposit balance falls due the same number of days after the call.",
  },
  {
    value: "custom",
    label: "Set per consultation",
    detail:
      "Whoever schedules the consultation can change the number of days; the value above is the default they start from.",
  },
];

type PolicyOption = {
  value: ConsultationNoShowPolicy;
  label: string;
  detail: string;
};

const NO_SHOW_OPTIONS: PolicyOption[] = [
  {
    value: "forfeit",
    label: "Keep the fee",
    detail:
      "The attorney's time was reserved, so a paid fee is kept and an unpaid one is still owed. This is what the system did before this setting existed.",
  },
  {
    value: "refund",
    label: "Refund automatically",
    detail:
      "A paid fee is returned in full. An unpaid invoice is voided so it never goes overdue or enters follow-ups.",
  },
  {
    value: "decide",
    label: "Decide case by case",
    detail:
      "Nothing moves automatically. If money is held, a task is raised for someone with refund permission to choose.",
  },
];

function OptionCard<T extends string>({
  option,
  selected,
  disabled,
  onSelect,
}: {
  option: { value: T; label: string; detail: string };
  selected: boolean;
  disabled: boolean;
  onSelect: (value: T) => void;
}) {
  return (
    <chakra.button
      type="button"
      textAlign="left"
      w="full"
      p="14px 16px"
      borderRadius="10px"
      border="1px solid"
      borderColor={selected ? "brand.solid" : "border"}
      bg={selected ? "brand.subtle" : "bg"}
      opacity={disabled ? 0.55 : 1}
      cursor={disabled ? "not-allowed" : "pointer"}
      onClick={() => !disabled && onSelect(option.value)}
      aria-pressed={selected}
      disabled={disabled}
    >
      <Text
        fontSize="14px"
        fontWeight="600"
        color={selected ? "brand.contrast" : "fg"}
      >
        {option.label}
      </Text>
      <Text fontSize="12px" color="fg.muted" mt="1" lineHeight="1.5">
        {option.detail}
      </Text>
    </chakra.button>
  );
}

function Card({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      overflow="hidden"
    >
      <Box p="20px" borderBottom="1px solid" borderColor="border.subtle">
        <Text fontSize="16px" fontWeight="600" color="fg">
          {title}
        </Text>
        <Text fontSize="13px" color="fg.muted" mt="1">
          {description}
        </Text>
      </Box>
      <Box p="20px">{children}</Box>
      {footer ? (
        <Flex
          align="center"
          justify="flex-end"
          px="20px"
          py="16px"
          borderTop="1px solid"
          borderColor="border.subtle"
        >
          {footer}
        </Flex>
      ) : null}
    </Box>
  );
}

export function ConsultationPaymentPolicy() {
  const { data: settings, isLoading } = useConsultationSettings();
  const update = useUpdateConsultationSettings();

  const [schedule, setSchedule] = useState<ConsultationFeeSchedule>("full_upfront");
  const [percent, setPercent] = useState("");
  const [balanceMode, setBalanceMode] =
    useState<ConsultationBalanceDueMode>("fixed");
  const [balanceDays, setBalanceDays] = useState("");
  const [policy, setPolicy] = useState<ConsultationNoShowPolicy>("forfeit");

  useEffect(() => {
    if (!settings) return;
    setSchedule(settings.feeSchedule);
    setPercent(
      settings.upfrontPercent != null ? String(settings.upfrontPercent) : "",
    );
    setBalanceMode(settings.balanceDueMode ?? "fixed");
    setBalanceDays(
      settings.balanceDueDays != null ? String(settings.balanceDueDays) : "",
    );
    setPolicy(settings.noShowPolicy);
  }, [settings]);

  // A schedule only means something when there is a fee to collect.
  const chargesFee = Boolean(settings?.chargesFee);

  const parsedPercent = Number(percent);
  const percentValid =
    schedule !== "partial_upfront" ||
    (percent.trim() !== "" &&
      Number.isInteger(parsedPercent) &&
      parsedPercent >= 1 &&
      parsedPercent <= 99);

  // Zero is a meaningful answer — "due on the day" — so an empty box is the
  // only invalid one, not a falsy number.
  const parsedDays = Number(balanceDays);
  const daysValid =
    schedule !== "partial_upfront" ||
    (balanceDays.trim() !== "" &&
      Number.isInteger(parsedDays) &&
      parsedDays >= 0 &&
      parsedDays <= 90);

  const scheduleDirty =
    settings != null &&
    (schedule !== settings.feeSchedule ||
      (schedule === "partial_upfront" &&
        (parsedPercent !== settings.upfrontPercent ||
          balanceMode !== (settings.balanceDueMode ?? "fixed") ||
          parsedDays !== settings.balanceDueDays)));

  const policyDirty = settings != null && policy !== settings.noShowPolicy;

  const save = (
    payload: Omit<Parameters<typeof update.mutate>[0], "chargesFee">,
  ) => {
    if (!settings) return;
    // The fee fields have to ride along: the service recomputes them from the
    // body on every save (`chargesFee` drives whether `defaultAmount` and
    // `feeStructure` are written or nulled), so omitting them clears them.
    //
    // Only the fee fields. `feeSchedule`, `noShowPolicy`, `timezone`,
    // `language` and `smsEnabled` are each written only when present, so an
    // absent one is left alone — do NOT start echoing those back, or this card
    // will happily overwrite a schedule the user changed in another tab.
    update.mutate({
      ...payload,
      chargesFee: settings.chargesFee,
      defaultAmount: settings.defaultAmount,
      feeStructure: settings.feeStructure,
    });
  };

  if (isLoading) {
    return (
      <Stack gap="6">
        {[0, 1].map((i) => (
          <Box
            key={i}
            border="1px solid"
            borderColor="border"
            borderRadius="10px"
            p="20px"
          >
            <ThemeSkeleton h="16px" w="180px" borderRadius="4px" mb="12px" />
            <Stack gap="3">
              <ThemeSkeleton h="64px" borderRadius="10px" />
              <ThemeSkeleton h="64px" borderRadius="10px" />
              <ThemeSkeleton h="64px" borderRadius="10px" />
            </Stack>
          </Box>
        ))}
      </Stack>
    );
  }

  return (
    <Stack gap="6">
      <Card
        title="Payment schedule"
        description={
          chargesFee
            ? "When the consultation fee is collected"
            : "When the consultation fee is collected — switch on consultation fees to change this"
        }
        footer={
          <Button
            onClick={() =>
              save({
                feeSchedule: schedule,
                upfrontPercent:
                  schedule === "partial_upfront" ? parsedPercent : null,
                // Cleared together with the deposit they belong to; the table's
                // CHECK requires both columns or neither.
                balanceDueMode:
                  schedule === "partial_upfront" ? balanceMode : null,
                balanceDueDays:
                  schedule === "partial_upfront" ? parsedDays : null,
              })
            }
            loading={update.isPending}
            disabled={
              !chargesFee || !scheduleDirty || !percentValid || !daysValid
            }
            layerStyle="brand-button"
            h="36px"
            px="16px"
            fontSize="13px"
          >
            Save schedule
          </Button>
        }
      >
        <Stack gap="3">
          {SCHEDULE_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              option={opt}
              selected={schedule === opt.value}
              disabled={!chargesFee}
              onSelect={setSchedule}
            />
          ))}
        </Stack>

        {schedule === "partial_upfront" ? (
          <Box mt="5">
            <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
              Deposit
            </Text>
            <Flex align="center" gap="2" maxW="200px">
              <Input
                value={percent}
                onChange={(e) => setPercent(e.currentTarget.value)}
                disabled={!chargesFee}
                type="number"
                min="1"
                max="99"
                step="1"
                placeholder="e.g. 50"
                borderColor="border"
                h="40px"
                fontSize="14px"
              />
              <Text fontSize="14px" color="fg.muted">
                % of the fee
              </Text>
            </Flex>
            {!percentValid ? (
              <Text fontSize="12px" color="red.400" mt="2">
                Enter a whole number between 1 and 99.
              </Text>
            ) : (
              <Text fontSize="12px" color="fg.muted" mt="2">
                A percentage rather than a fixed amount, so it stays correct when
                the fee changes — including emergency rates.
              </Text>
            )}

            <Text fontSize="13px" fontWeight="600" color="fg" mt="5" mb="2">
              When the balance is due
            </Text>
            <Flex align="center" gap="2" maxW="260px">
              <Input
                value={balanceDays}
                onChange={(e) => setBalanceDays(e.currentTarget.value)}
                disabled={!chargesFee}
                type="number"
                min="0"
                max="90"
                step="1"
                placeholder="e.g. 7"
                borderColor="border"
                h="40px"
                fontSize="14px"
              />
              <Text fontSize="14px" color="fg.muted" flexShrink={0}>
                days after the consultation
              </Text>
            </Flex>
            {!daysValid ? (
              <Text fontSize="12px" color="red.400" mt="2">
                Enter a whole number of days between 0 and 90.
              </Text>
            ) : (
              <Text fontSize="12px" color="fg.muted" mt="2">
                The client is emailed a payment link for the balance on that day.
              </Text>
            )}

            <Stack gap="2" mt="4">
              {BALANCE_MODE_OPTIONS.map((opt) => (
                <OptionCard
                  key={opt.value}
                  option={opt}
                  selected={balanceMode === opt.value}
                  disabled={!chargesFee}
                  onSelect={setBalanceMode}
                />
              ))}
            </Stack>
          </Box>
        ) : null}
      </Card>

      <Card
        title="No-show policy"
        description="What happens to the fee when the lead does not attend"
        footer={
          <Button
            onClick={() => save({ noShowPolicy: policy })}
            loading={update.isPending}
            disabled={!policyDirty}
            layerStyle="brand-button"
            h="36px"
            px="16px"
            fontSize="13px"
          >
            Save policy
          </Button>
        }
      >
        <Stack gap="3">
          {NO_SHOW_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              option={opt}
              selected={policy === opt.value}
              disabled={false}
              onSelect={setPolicy}
            />
          ))}
        </Stack>
      </Card>
    </Stack>
  );
}
