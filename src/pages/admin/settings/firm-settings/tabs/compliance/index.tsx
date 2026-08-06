import {
  Box,
  Button,
  Flex,
  Grid,
  Separator,
  Switch,
  Text,
} from "@chakra-ui/react";
import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { FormSelect } from "@/components/ui/form-select";

const RETENTION_OPTIONS = [
  { label: "1 year", value: "1 year" },
  { label: "3 years", value: "3 years" },
  { label: "5 years", value: "5 years" },
  { label: "7 years", value: "7 years" },
  { label: "10 years", value: "10 years" },
  { label: "Indefinite", value: "Indefinite" },
];

const AUDIT_RETENTION_OPTIONS = [
  { label: "30 days", value: "30 days" },
  { label: "60 days", value: "60 days" },
  { label: "90 days", value: "90 days" },
  { label: "180 days", value: "180 days" },
  { label: "1 year", value: "1 year" },
];

const SESSION_TIMEOUT_OPTIONS = [
  { label: "15 min", value: "15 min" },
  { label: "30 min", value: "30 min" },
  { label: "1 hour", value: "1 hour" },
  { label: "2 hours", value: "2 hours" },
  { label: "4 hours", value: "4 hours" },
];

const CONFLICT_SCOPE_OPTIONS = [
  { label: "All matters + CRM leads", value: "All matters + CRM leads" },
  { label: "Active matters only", value: "Active matters only" },
  { label: "All matters", value: "All matters" },
  { label: "CRM leads only", value: "CRM leads only" },
];

function Card({ children }: { children: React.ReactNode }) {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg"
      overflow="hidden"
    >
      {children}
    </Box>
  );
}

function CardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <Flex
      align="flex-start"
      justify="space-between"
      gap="4"
      p="20px"
      borderBottom="1px solid"
      borderColor="border.subtle"
    >
      <Box>
        <Text fontSize="16px" fontWeight="600" color="fg">
          {title}
        </Text>
        {subtitle && (
          <Text fontSize="13px" color="fg.muted" mt="1">
            {subtitle}
          </Text>
        )}
      </Box>
    </Flex>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Flex
      align={{ base: "start", md: "center" }}
      justify="space-between"
      gap="4"
      direction={{ base: "column", md: "row" }}
      py="4"
      borderBottom="1px solid"
      borderColor="border.subtle"
      _last={{ borderBottom: "none" }}
    >
      <Box flex="1">
        <Text fontSize="14px" fontWeight="500" color="fg">
          {label}
        </Text>
        {description && (
          <Text fontSize="12px" color="fg.muted" mt="0.5">
            {description}
          </Text>
        )}
      </Box>
      <Box minW={{ base: "full", md: "120px" }} w={{ base: "full", md: "auto" }}>
        {children}
      </Box>
    </Flex>
  );
}

function ThemedSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (e: { checked: boolean }) => void;
}) {
  return (
    <Switch.Root checked={checked} onCheckedChange={onCheckedChange} size="sm">
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

export default function ComplianceTab() {
  const [retentionPeriod, setRetentionPeriod] = useState("7 years");
  const [auditLogRetention, setAuditLogRetention] = useState("90 days");
  const [sessionTimeout, setSessionTimeout] = useState("30 min");
  const [auditLogTracking, setAuditLogTracking] = useState(true);
  const [requireMfa, setRequireMfa] = useState(true);
  const [hipaaMode, setHipaaMode] = useState(false);
  const [operatingLabel, setOperatingLabel] = useState("Operating Account");
  const [trustLabel, setTrustLabel] = useState("IOLTA Trust Account");
  const [conflictScope, setConflictScope] = useState(
    "All matters + CRM leads",
  );
  const [autoConflict, setAutoConflict] = useState(true);

  const [saved, setSaved] = useState({
    retentionPeriod: "7 years",
    auditLogRetention: "90 days",
    sessionTimeout: "30 min",
    auditLogTracking: true,
    requireMfa: true,
    hipaaMode: false,
    operatingLabel: "Operating Account",
    trustLabel: "IOLTA Trust Account",
    conflictScope: "All matters + CRM leads",
    autoConflict: true,
  });

  const isDirty =
    retentionPeriod !== saved.retentionPeriod ||
    auditLogRetention !== saved.auditLogRetention ||
    sessionTimeout !== saved.sessionTimeout ||
    auditLogTracking !== saved.auditLogTracking ||
    requireMfa !== saved.requireMfa ||
    hipaaMode !== saved.hipaaMode ||
    operatingLabel !== saved.operatingLabel ||
    trustLabel !== saved.trustLabel ||
    conflictScope !== saved.conflictScope ||
    autoConflict !== saved.autoConflict;

  function handleSave() {
    setSaved({
      retentionPeriod,
      auditLogRetention,
      sessionTimeout,
      auditLogTracking,
      requireMfa,
      hipaaMode,
      operatingLabel,
      trustLabel,
      conflictScope,
      autoConflict,
    });
  }

  return (
    <Box display="flex" flexDirection="column" gap="6">
      {/* Data & retention */}
      <Card>
        <CardHeader title="Data & retention" />
        <Box px={{ base: "4", md: "5" }}>
          <SettingRow
            label="Data retention period"
            description="Determine how many years document revisions are stored"
          >
            <FormSelect
              options={RETENTION_OPTIONS}
              value={retentionPeriod}
              onChange={setRetentionPeriod}
              size="sm"
            />
          </SettingRow>
          <SettingRow
            label="Audit log retention"
            description="Keep platform-wide user activity logs for security purposes"
          >
            <FormSelect
              options={AUDIT_RETENTION_OPTIONS}
              value={auditLogRetention}
              onChange={setAuditLogRetention}
              size="sm"
            />
          </SettingRow>
          <SettingRow
            label="Session timeout"
            description="Auto sign out staff after inactivity threshold"
          >
            <FormSelect
              options={SESSION_TIMEOUT_OPTIONS}
              value={sessionTimeout}
              onChange={setSessionTimeout}
              size="sm"
            />
          </SettingRow>
          <SettingRow
            label="Enable audit log security tracking"
            description="Write database read/write actions into audit trails for HIPAA/SEC compliance"
          >
            <ThemedSwitch
              checked={auditLogTracking}
              onCheckedChange={(e) => setAuditLogTracking(e.checked)}
            />
          </SettingRow>
        </Box>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader title="Security" />
        <Box px={{ base: "4", md: "5" }}>
          <SettingRow
            label="Require multi-factor authentication (MFA)"
            description="All staff must enable MFA to access the platform"
          >
            <ThemedSwitch
              checked={requireMfa}
              onCheckedChange={(e) => setRequireMfa(e.checked)}
            />
          </SettingRow>
          <SettingRow
            label="HIPAA compliance mode"
            description="Restricts certain data fields and enables additional audit controls"
          >
            <ThemedSwitch
              checked={hipaaMode}
              onCheckedChange={(e) => setHipaaMode(e.checked)}
            />
          </SettingRow>
        </Box>
      </Card>

      {/* ABA Rule 1.15 */}
      <Card>
        <CardHeader
          title="ABA Rule 1.15 — Account labels"
          subtitle="Customize how operating and trust accounts are labelled throughout the platform"
        />
        <Box p={{ base: "4", md: "5" }}>
          <Grid
            templateColumns={{ base: "1fr", md: "1fr 1fr" }}
            gap="4"
            mb="5"
          >
            <Box>
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                Operating account label
              </Text>
              <FormSelect
                options={[
                  { label: "Operating Account", value: "Operating Account" },
                  { label: "Operating", value: "Operating" },
                  { label: "General Account", value: "General Account" },
                ]}
                value={operatingLabel}
                onChange={setOperatingLabel}
                size="sm"
              />
              <Text fontSize="12px" color="fg.muted" mt="1">
                Used for attorney fees, paralegal fees, and firm revenue
              </Text>
            </Box>
            <Box>
              <Text fontSize="13px" fontWeight="600" color="fg" mb="2">
                Trust / IOLTA label
              </Text>
              <FormSelect
                options={[
                  { label: "IOLTA Trust Account", value: "IOLTA Trust Account" },
                  { label: "Trust Account", value: "Trust Account" },
                  { label: "Client Trust", value: "Client Trust" },
                ]}
                value={trustLabel}
                onChange={setTrustLabel}
                size="sm"
              />
              <Text fontSize="12px" color="fg.muted" mt="1">
                Used for client funds, filing fees, and third-party costs
              </Text>
            </Box>
          </Grid>

          <Separator mb="4" />

          <SettingRow
            label="Conflict check scope"
            description="Choose which data scopes are scanned during conflict check trials"
          >
            <FormSelect
              options={CONFLICT_SCOPE_OPTIONS}
              value={conflictScope}
              onChange={setConflictScope}
              size="sm"
            />
          </SettingRow>
          <SettingRow
            label="Auto-run conflict check on new leads"
            description="Trigger name conflict search automatically on CRM lead submission"
          >
            <ThemedSwitch
              checked={autoConflict}
              onCheckedChange={(e) => setAutoConflict(e.checked)}
            />
          </SettingRow>

          <Box
            border="1px solid"
            borderColor="brand.muted"
            borderRadius="8px"
            bg="transparent"
            p="14px"
            mt="4"
          >
            <Flex align="center" gap="2" mb="1">
              <ShieldCheck size={16} color="brand.solid" />
              <Text fontSize="13px" fontWeight="600" color="brand.solid">
                ABA Rule 1.15 compliant
              </Text>
            </Flex>
            <Text fontSize="12px" color="fg.muted">
              Trust and operating accounts are segregated throughout all billing
              flows — compliant with Illinois Bar recommendations.
            </Text>
          </Box>
        </Box>
      </Card>

      {/* Footer */}
      <Flex justify="flex-end" gap="3">
        <Button variant="outline" size="sm" color="fg" disabled={!isDirty}>
          Reset to defaults
        </Button>
        <Button
          layerStyle="brand-button"
          h="36px"
          px="16px"
          fontSize="13px"
          disabled={!isDirty}
          onClick={handleSave}
        >
          Save changes
        </Button>
      </Flex>
    </Box>
  );
}
