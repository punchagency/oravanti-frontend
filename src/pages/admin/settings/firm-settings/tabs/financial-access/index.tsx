import type {
  AccessLevel,
  FinanceRole,
  FinancialAccessControlInput,
} from "@/api/financial-access";
import { FormSelect } from "@/components/ui/form-select";
import { ThemeSkeleton } from "@/components/ui/theme-skeleton";
import {
  useFinancialAccess,
  useSetFinancialAccess,
} from "@/hooks/use-financial-access";
import { useHasPermission } from "@/hooks/use-has-permission";
import { useConfirmStore } from "@/store/confirm-store";
import { Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import { Info, Lock, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

/**
 * Who at the firm may see and touch trust (IOLTA) money.
 *
 * Its own tab rather than a card under Payments, and that is necessary rather
 * than tidy: the Payments tab returns early when no processor is connected, so
 * a firm holding client money in an IOLTA account but taking cheques would
 * never be able to reach this.
 *
 * ## Why there is no operating column
 *
 * `AccountAccess.operating` is stored and resolved but never read — there is no
 * enforcement site for it anywhere in the backend, no `requireOperatingWrite`
 * to match `requireTrustWrite`, and `FinanceRestrictions` carries only `trust`.
 * An editable operating control would therefore save a preference that changes
 * nothing, which is worse than not offering it: the firm would believe it had
 * restricted access when it had not.
 */

const LEVELS: { value: AccessLevel; label: string }[] = [
  { value: "full_access", label: "Full access" },
  { value: "view_only", label: "View only" },
  { value: "no_access", label: "No access" },
];

/**
 * The matrix is keyed on a coarse visibility tier, not on the assignable role
 * roster — a firm's custom roles do not appear here, and `owner` has no tier of
 * its own because an owner may not even have a staff row.
 */
const ROLES: { value: FinanceRole; label: string; detail: string }[] = [
  {
    value: "admin",
    label: "Admin",
    detail: "Includes Super admin — owners are treated as admins here.",
  },
  { value: "attorney", label: "Attorney", detail: "" },
  { value: "paralegal", label: "Paralegal", detail: "" },
  { value: "legal_assistant", label: "Legal assistant", detail: "" },
  { value: "receptionist", label: "Receptionist", detail: "" },
  {
    value: "client",
    label: "Client",
    detail: "Clients viewing their own matters in the portal.",
  },
];

const DEFAULT_LEVEL: AccessLevel = "no_access";

const Card = ({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) => (
  <Box border="1px solid" borderColor="border" borderRadius="10px" bg="bg">
    <Box p="20px" borderBottom="1px solid" borderColor="border.subtle">
      <Text textStyle="label">{title}</Text>
      {description ? (
        <Text fontSize="12px" color="fg.muted" mt="4px" lineHeight="1.6">
          {description}
        </Text>
      ) : null}
    </Box>
    <Box p="20px">{children}</Box>
    {footer ? (
      <Box p="16px 20px" borderTop="1px solid" borderColor="border.subtle">
        {footer}
      </Box>
    ) : null}
  </Box>
);

const Notice = ({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Flex
    gap="10px"
    align="flex-start"
    p="12px 14px"
    borderRadius="8px"
    bg="bg.subtle"
    border="1px solid"
    borderColor="border.subtle"
  >
    <Box mt="1px" color="fg.muted">
      {icon}
    </Box>
    <Text fontSize="12px" color="fg.muted" lineHeight="1.6">
      {children}
    </Text>
  </Flex>
);

export default function FinancialAccessTab() {
  const canConfigure = useHasPermission("finance", "configure");
  const { data, isLoading } = useFinancialAccess();
  const save = useSetFinancialAccess();
  const showConfirm = useConfirmStore((s) => s.showConfirm);

  // Edits held locally until Save. Keyed by role; only the trust column is
  // editable, so there is no need to model the account type here.
  const [edits, setEdits] = useState<Partial<Record<FinanceRole, AccessLevel>>>(
    {},
  );

  const stored = useMemo(() => {
    const trust = data?.controls?.trust_iolta ?? {};
    return Object.fromEntries(
      ROLES.map((r) => [r.value, (trust[r.value] as AccessLevel) ?? DEFAULT_LEVEL]),
    ) as Record<FinanceRole, AccessLevel>;
  }, [data]);

  const valueFor = (role: FinanceRole): AccessLevel =>
    edits[role] ?? stored[role] ?? DEFAULT_LEVEL;

  const changed = ROLES.filter((r) => valueFor(r.value) !== stored[r.value]);
  const dirty = changed.length > 0;

  const commit = () => {
    const controls: FinancialAccessControlInput[] = changed.map((r) => ({
      accountType: "trust_iolta",
      role: r.value,
      permission: valueFor(r.value),
    }));
    save.mutate(controls, { onSuccess: () => setEdits({}) });
  };

  const onSave = () => {
    // The one change worth interrupting for: an admin lowering the tier they
    // are themselves resolved under. `viewer` comes from the server precisely
    // so this test does not depend on re-deriving the role rules here.
    const viewerRole = data?.viewer.financeRole;
    const viewerTier = viewerRole === "owner" ? "admin" : viewerRole;
    const own = changed.find((r) => r.value === viewerTier);

    if (own && data && valueFor(own.value) !== "full_access") {
      showConfirm({
        title: "Remove your own trust access?",
        description:
          `You are lowering ${own.label} to "${
            LEVELS.find((l) => l.value === valueFor(own.value))?.label
          }", and that is the tier you are treated as. ` +
          "You will lose access to trust figures immediately, and only someone " +
          "who can configure finance settings will be able to restore it.",
        confirmLabel: "Yes, change it",
        onConfirm: commit,
      });
      return;
    }

    commit();
  };

  if (!canConfigure) {
    return (
      <Box pt="6" maxW="760px">
        <Notice icon={<Lock size={14} />}>
          You do not have permission to change financial access for this firm.
          Ask a Super admin or admin.
        </Notice>
      </Box>
    );
  }

  return (
    <Box pt="6" maxW="760px" display="flex" flexDirection="column" gap="16px">
      <Card
        title="Trust (IOLTA) access"
        description="Client money the firm holds. Deny-by-default — a role sees none of it unless granted here."
        footer={
          <Flex justify="space-between" align="center" gap="12px" wrap="wrap">
            <Text fontSize="12px" color="fg.muted">
              {dirty
                ? `${changed.length} unsaved change${changed.length === 1 ? "" : "s"}`
                : "No unsaved changes"}
            </Text>
            <HStack gap="8px">
              {dirty ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEdits({})}
                  disabled={save.isPending}
                >
                  Discard
                </Button>
              ) : null}
              <Button
                size="sm"
                layerStyle="brand-button"
                disabled={!dirty}
                loading={save.isPending}
                onClick={onSave}
              >
                Save changes
              </Button>
            </HStack>
          </Flex>
        }
      >
        {isLoading ? (
          <Flex direction="column" gap="10px">
            {ROLES.map((r) => (
              <ThemeSkeleton key={r.value} h="38px" borderRadius="8px" />
            ))}
          </Flex>
        ) : (
          <Flex direction="column" gap="10px">
            {ROLES.map((role) => (
              <Flex
                key={role.value}
                align="center"
                justify="space-between"
                gap="12px"
                wrap="wrap"
              >
                <Box>
                  <Text fontSize="13px" fontWeight="500" color="fg">
                    {role.label}
                  </Text>
                  {role.detail ? (
                    <Text fontSize="12px" color="fg.muted" mt="1px">
                      {role.detail}
                    </Text>
                  ) : null}
                </Box>
                <FormSelect
                  size="sm"
                  minW="150px"
                  ariaLabel={`Trust access for ${role.label}`}
                  options={LEVELS}
                  value={valueFor(role.value)}
                  onChange={(v) =>
                    setEdits((prev) => ({ ...prev, [role.value]: v as AccessLevel }))
                  }
                />
              </Flex>
            ))}
          </Flex>
        )}
      </Card>

      <Notice icon={<Info size={14} />}>
        Operating-account data — the firm&rsquo;s own revenue — is visible to all
        staff and cannot be restricted here.
      </Notice>

      <Notice icon={<ShieldCheck size={14} />}>
        Changes take effect on the next request. A role set to{" "}
        <strong>View only</strong> can see trust figures but cannot record trust
        payments or add trust lines to an invoice.
      </Notice>
    </Box>
  );
}
