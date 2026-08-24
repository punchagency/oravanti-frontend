import type {
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
      "The deposit unlocks booking. The balance is invoiced as a second instalment on the same invoice, due when the consultation happens.",
  },
  {
    value: "after_consultation",
    label: "Paid after the consultation",
    detail:
      "The client books freely and is emailed the invoice once the consultation is marked complete.",
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
  const [policy, setPolicy] = useState<ConsultationNoShowPolicy>("forfeit");

  useEffect(() => {
    if (!settings) return;
    setSchedule(settings.feeSchedule);
    setPercent(
      settings.upfrontPercent != null ? String(settings.upfrontPercent) : "",
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

  const scheduleDirty =
    settings != null &&
    (schedule !== settings.feeSchedule ||
      (schedule === "partial_upfront" &&
        parsedPercent !== settings.upfrontPercent));

  const policyDirty = settings != null && policy !== settings.noShowPolicy;

  const save = (
    payload: Omit<Parameters<typeof update.mutate>[0], "chargesFee">,
  ) => {
    if (!settings) return;
    // The endpoint is an upsert over the whole settings shape, so the fee
    // fields have to ride along or saving a schedule would clear them.
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
              })
            }
            loading={update.isPending}
            disabled={!chargesFee || !scheduleDirty || !percentValid}
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
