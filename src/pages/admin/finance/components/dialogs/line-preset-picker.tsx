import type { LinePreset } from "@/api/finance";
import { BrandButton, OutlineButton } from "@/components/ui/intake-ui";
import { useLinePresets, useSaveLinePreset } from "@/hooks/use-finance";
import { formatCurrency } from "@/utils/currency";
import {
  Box,
  Checkbox,
  Flex,
  Grid,
  Input,
  Spinner,
  Text,
  chakra,
} from "@chakra-ui/react";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { fieldStyles } from "./dialog-styles";

/**
 * Compose an invoice line by picking it from the firm's catalog.
 *
 * Typing every charge by hand produced three errors worth a whole feature to
 * prevent: the wrong amount on a published fee, the wrong account on money the
 * firm merely holds, and five spellings of one charge that no report can add
 * up. So the flow asks the two questions in the order that actually decides
 * things — **which account, then which charge** — and fills in the amount.
 *
 * What it deliberately does NOT do is lock the line down. Everything it fills
 * in stays editable on the row it creates: a preset is a starting point, and a
 * negotiated fee that cannot be typed would just push staff back to a blank
 * line. The catalog reduces the typing, it does not police it.
 *
 * Rendered inline rather than as a nested Dialog or Popover. This lives inside
 * an already-open Dialog, and stacking another focus trap inside that one is
 * the single most reliable way to break keyboard navigation in Chakra v3.
 */

export type PickedLine = {
  description: string;
  rate: string;
  account: LinePresetAccount;
  presetId?: string;
};

type LinePresetAccount = "operating" | "trust_iolta";

const ACCOUNT_STEP: {
  value: LinePresetAccount;
  label: string;
  hint: string;
}[] = [
  {
    value: "operating",
    label: "Operating",
    hint: "The firm's own earned revenue — fees, drafting, appearances",
  },
  {
    value: "trust_iolta",
    label: "Trust (IOLTA)",
    hint: "Client money the firm holds — retainers, filing fees, court costs",
  },
];

const RANK_LABEL: Record<LinePreset["rank"], string> = {
  case_type: "For this case type",
  practice_area: "For this practice area",
  general: "General",
};

const RANK_ORDER: LinePreset["rank"][] = [
  "case_type",
  "practice_area",
  "general",
];

export function LinePresetPicker({
  practiceAreaId,
  caseTypeId,
  onAdd,
  onClose,
}: {
  /** The matter's scope. Absent is fine — the general tier still applies. */
  practiceAreaId?: string;
  caseTypeId?: string;
  /** Called once per charge added. The picker stays open. */
  onAdd: (line: PickedLine) => void;
  onClose: () => void;
}) {
  const [account, setAccount] = useState<LinePresetAccount | null>(null);
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [customRate, setCustomRate] = useState("");
  const [saveCustom, setSaveCustom] = useState(false);

  const savePreset = useSaveLinePreset();

  // Fetched without an account filter so the Trust step's availability is known
  // before it is picked. `restrictions` is the answer to "may this person write
  // trust lines"; an empty trust list is not, since a firm can simply have none
  // yet and must still be able to add a custom one.
  const presetsQuery = useLinePresets({ practiceAreaId, caseTypeId });
  const trustAllowed = presetsQuery.data?.restrictions.trust === "full_access";

  const accountOptions = ACCOUNT_STEP.filter(
    (option) => option.value === "operating" || trustAllowed,
  );

  const grouped = useMemo(() => {
    const all = presetsQuery.data?.presets ?? [];
    const needle = search.trim().toLowerCase();
    const matching = all.filter(
      (preset) =>
        preset.account === account &&
        (!needle ||
          preset.name.toLowerCase().includes(needle) ||
          (preset.note ?? "").toLowerCase().includes(needle)),
    );

    return RANK_ORDER.map((rank) => ({
      rank,
      presets: matching.filter((preset) => preset.rank === rank),
    })).filter((group) => group.presets.length > 0);
  }, [presetsQuery.data, account, search]);

  const addPreset = (preset: LinePreset) => {
    onAdd({
      description: preset.name,
      // Copied, never linked. The invoice is a snapshot and must not restate
      // itself because the catalog was corrected afterwards.
      rate: preset.defaultRate.toFixed(2),
      account: preset.account,
      presetId: preset.id,
    });
  };

  const addCustom = () => {
    const name = customName.trim();
    if (!name || !account) return;

    if (saveCustom) {
      // Fire and forget: saving is an extra, and its failure must not stop the
      // line from being added. The hook reports its own errors.
      savePreset.mutate({
        name,
        account,
        defaultRate: Number(customRate) || 0,
        practiceAreaId,
        caseTypeId,
      });
    }

    onAdd({ description: name, rate: customRate || "0", account });
    setCustomName("");
    setCustomRate("");
    setSaveCustom(false);
  };

  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      bg="bg.subtle"
      p="14px"
    >
      {account === null ? (
        <>
          <Text fontSize="12px" fontWeight="600" mb="2px">
            Where should these funds go?
          </Text>
          <Text fontSize="11px" color="fg.muted" mb="10px">
            This decides which charges you can pick from next.
          </Text>
          <Grid
            templateColumns={{ base: "1fr", md: "1fr 1fr" }}
            gap="8px"
          >
            {accountOptions.map((option) => (
              <chakra.button
                key={option.value}
                type="button"
                textAlign="left"
                p="12px"
                border="1px solid"
                borderColor="border"
                borderRadius="9px"
                bg="bg"
                cursor="pointer"
                _hover={{ borderColor: "brand.solid", bg: "bg.muted" }}
                onClick={() => setAccount(option.value)}
              >
                <Text fontSize="13px" fontWeight="600">
                  {option.label}
                </Text>
                <Text fontSize="11px" color="fg.muted" mt="2px">
                  {option.hint}
                </Text>
              </chakra.button>
            ))}
          </Grid>
          <Flex justify="flex-end" mt="10px">
            <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          </Flex>
        </>
      ) : (
        <>
          <Flex justify="space-between" align="center" mb="10px" gap="8px">
            <Flex align="center" gap="8px" minW={0}>
              <OutlineButton onClick={() => setAccount(null)}>
                <ArrowLeft size={13} />
                Back
              </OutlineButton>
              <Text fontSize="12px" fontWeight="600" truncate>
                {account === "trust_iolta" ? "Trust (IOLTA)" : "Operating"}
              </Text>
            </Flex>
            <OutlineButton onClick={onClose}>Done</OutlineButton>
          </Flex>

          <Flex align="center" gap="8px" mb="10px">
            <Search size={14} color="var(--chakra-colors-fg-muted)" />
            <Input
              placeholder="Search charges"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              {...fieldStyles}
            />
          </Flex>

          {presetsQuery.isLoading ? (
            <Flex justify="center" py="20px">
              <Spinner size="sm" />
            </Flex>
          ) : grouped.length === 0 ? (
            <Text fontSize="12px" color="fg.muted" py="8px">
              {search.trim()
                ? "Nothing matches that. Add it as a custom line below."
                : "No saved charges for this account yet — add one below."}
            </Text>
          ) : (
            <Flex
              direction="column"
              maxH="240px"
              overflowY="auto"
              border="1px solid"
              borderColor="border"
              borderRadius="9px"
              bg="bg"
            >
              {grouped.map((group) => (
                <Box key={group.rank}>
                  <Text
                    fontSize="10px"
                    fontWeight="600"
                    textTransform="uppercase"
                    letterSpacing="0.4px"
                    color="fg.muted"
                    px="12px"
                    py="6px"
                    bg="bg.subtle"
                    position="sticky"
                    top="0"
                  >
                    {RANK_LABEL[group.rank]}
                  </Text>
                  {group.presets.map((preset) => (
                    <chakra.button
                      key={preset.id}
                      type="button"
                      display="flex"
                      w="100%"
                      alignItems="center"
                      justifyContent="space-between"
                      gap="10px"
                      textAlign="left"
                      px="12px"
                      py="9px"
                      borderTop="1px solid"
                      borderColor="border.muted"
                      cursor="pointer"
                      _hover={{ bg: "bg.muted" }}
                      onClick={() => addPreset(preset)}
                    >
                      <Box minW={0}>
                        <Flex align="center" gap="6px">
                          <Text fontSize="13px" truncate>
                            {preset.name}
                          </Text>
                          {preset.origin === "firm" && (
                            <Text
                              fontSize="9px"
                              fontWeight="600"
                              textTransform="uppercase"
                              color="fg.muted"
                              border="1px solid"
                              borderColor="border"
                              borderRadius="4px"
                              px="4px"
                              flexShrink={0}
                            >
                              Yours
                            </Text>
                          )}
                        </Flex>
                        {preset.note && (
                          <Text fontSize="11px" color="fg.muted" truncate>
                            {preset.note}
                          </Text>
                        )}
                      </Box>
                      <Text fontSize="13px" fontWeight="600" flexShrink={0}>
                        {formatCurrency(preset.defaultRate)}
                      </Text>
                    </chakra.button>
                  ))}
                </Box>
              ))}
            </Flex>
          )}

          <Box
            mt="12px"
            pt="12px"
            borderTop="1px solid"
            borderColor="border"
          >
            <Text fontSize="11px" fontWeight="600" mb="6px">
              Add a custom line
            </Text>
            <Grid
              templateColumns={{ base: "1fr", md: "minmax(0, 1fr) 110px auto" }}
              gap="8px"
              alignItems="center"
            >
              <Input
                placeholder="Description"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                {...fieldStyles}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={customRate}
                onChange={(e) => setCustomRate(e.target.value)}
                {...fieldStyles}
              />
              <BrandButton
                onClick={addCustom}
                disabled={!customName.trim()}
              >
                <Plus size={13} />
                Add
              </BrandButton>
            </Grid>

            <Checkbox.Root
              mt="8px"
              checked={saveCustom}
              onCheckedChange={(d) => setSaveCustom(d.checked === true)}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
              <Checkbox.Label fontSize="11px" color="fg.muted">
                Save this to our firm's list for next time
              </Checkbox.Label>
            </Checkbox.Root>
          </Box>
        </>
      )}
    </Box>
  );
}
