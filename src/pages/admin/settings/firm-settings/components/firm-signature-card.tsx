import type { FeeAgreementSigningOrder } from "@/api/fee-agreement-settings";
import { FormSelect } from "@/components/ui/form-select";
import { useCanUpdateFirmSettings } from "@/hooks/use-can-update-firm-settings";
import {
  useEligibleSigners,
  useFeeAgreementSettings,
  useUpdateFeeAgreementSettings,
} from "@/hooks/use-fee-agreement-settings";
import { Box, Flex, Switch, Text } from "@chakra-ui/react";
import { useMemo } from "react";

/**
 * Whether the firm counter-signs its own retainers, and on what terms.
 *
 * Defaults to on. A retainer the firm never signed is what this exists to fix,
 * so counter-signing is the flow and opting out is the decision — but it is a
 * decision a firm is allowed to make, and turning it off restores exactly the
 * single-signer behaviour that shipped before.
 *
 * The four sub-settings only apply when it is on, and are hidden rather than
 * disabled when it is off: a greyed-out row invites a firm to wonder what it
 * would have done.
 */
function ThemedSwitch({
  checked,
  disabled,
  onCheckedChange,
}: {
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <Switch.Root
      checked={checked}
      disabled={disabled}
      onCheckedChange={(e) => onCheckedChange(e.checked)}
      size="sm"
    >
      <Switch.HiddenInput />
      <Switch.Control
        bg={checked ? "brand.solid" : "bg.muted"}
        _hover={{ bg: checked ? "brand.solid" : "bg.muted" }}
      >
        <Switch.Thumb bg="white" />
      </Switch.Control>
    </Switch.Root>
  );
}

function SettingRow({
  label,
  detail,
  children,
  last = false,
}: {
  label: string;
  detail: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <Flex
      align="flex-start"
      justify="space-between"
      gap="24px"
      py="16px"
      borderBottom={last ? undefined : "1px solid"}
      borderColor="border.subtle"
    >
      <Box>
        <Text fontSize="13px" fontWeight="600">
          {label}
        </Text>
        <Text fontSize="12px" color="fg.muted" mt="2px" lineHeight="1.6">
          {detail}
        </Text>
      </Box>
      <Box flexShrink={0} pt="2px">
        {children}
      </Box>
    </Flex>
  );
}

const ORDER_OPTIONS: { value: FeeAgreementSigningOrder; label: string }[] = [
  { value: "client_first", label: "Client, then the firm" },
  { value: "firm_first", label: "The firm, then the client" },
];

export function FirmSignatureCard() {
  const canEdit = useCanUpdateFirmSettings();
  const { data, isLoading } = useFeeAgreementSettings();
  const update = useUpdateFeeAgreementSettings();
  const requiresSignature = data?.requiresFirmSignature ?? true;
  const { data: signers } = useEligibleSigners(requiresSignature);

  const signerOptions = useMemo(
    () => [
      { value: "", label: "The firm owner" },
      ...(signers ?? []).map((s) => ({ value: s.staffId, label: s.name })),
    ],
    [signers],
  );

  const disabled = !canEdit || update.isPending;

  return (
    <Box border="1px solid" borderColor="border" borderRadius="10px" bg="bg">
      <Box p="20px" borderBottom="1px solid" borderColor="border.subtle">
        <Text textStyle="label">Signing a fee agreement</Text>
        <Text fontSize="12px" color="fg.muted" mt="4px" lineHeight="1.6">
          A retainer binds the firm as well as the client. This decides who
          signs for the firm, and what waits for that signature.
        </Text>
      </Box>

      <Box px="20px" pb="4px">
        {isLoading ? (
          <Text fontSize="13px" color="fg.muted" py="16px">
            Loading…
          </Text>
        ) : (
          <>
            <SettingRow
              label="Require a firm signature"
              detail="Off means the client's signature alone executes the agreement, exactly as it did before."
              last={!requiresSignature}
            >
              <ThemedSwitch
                checked={requiresSignature}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  update.mutate({ requiresFirmSignature: checked })
                }
              />
            </SettingRow>

            {requiresSignature ? (
              <>
                <SettingRow
                  label="Signing order"
                  detail="Client first is the usual counter-signature: the attorney executes a document they have seen the client accept. Firm first holds the client's email until the attorney has signed."
                >
                  <FormSelect
                    ariaLabel="Signing order"
                    width="220px"
                    disabled={disabled}
                    options={ORDER_OPTIONS}
                    value={data?.signingOrder ?? "client_first"}
                    onChange={(value) =>
                      update.mutate({
                        signingOrder: value as FeeAgreementSigningOrder,
                      })
                    }
                  />
                </SettingRow>

                <SettingRow
                  label="Hold the invoice until the firm signs"
                  detail="On, nothing is billed against an agreement the firm has not executed. Off bills on the client's signature and lets the counter-signature follow — the case still cannot open until both have signed."
                >
                  <ThemedSwitch
                    checked={data?.invoiceWaitsForFirmSignature ?? true}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      update.mutate({ invoiceWaitsForFirmSignature: checked })
                    }
                  />
                </SettingRow>

                <SettingRow
                  label="Let the drafter choose the signer"
                  detail="Off locks every agreement to the consultation attorney, or the fallback below when they cannot sign."
                >
                  <ThemedSwitch
                    checked={data?.allowSignerOverride ?? true}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      update.mutate({ allowSignerOverride: checked })
                    }
                  />
                </SettingRow>

                <SettingRow
                  label="Fallback signer"
                  detail="Used when the consultation attorney is not permitted to sign. Only staff whose role grants fee-agreement signing are listed."
                  last
                >
                  <FormSelect
                    ariaLabel="Fallback signer"
                    width="220px"
                    disabled={disabled}
                    options={signerOptions}
                    value={data?.defaultSignerStaffId ?? ""}
                    onChange={(value) =>
                      update.mutate({ defaultSignerStaffId: value || null })
                    }
                  />
                </SettingRow>
              </>
            ) : null}
          </>
        )}
      </Box>

      {requiresSignature ? (
        <Box px="20px" pb="20px">
          {/* The one thing a firm cannot fix from this screen, and the most
              likely support call: nobody eligible to sign. */}
          <Text fontSize="12px" color="fg.muted" lineHeight="1.6">
            Who may sign is a permission, not a job title. Grant "Fee agreements
            — sign" to a role under Roles &amp; permissions to widen the list.
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}
