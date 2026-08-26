import type {
  IntakePipelineStepInput,
  IntakePipelineTemplateStep,
  PipelineStage,
} from "@/api/intake-pipeline-template";
import { SurfaceCard } from "@/components/ui/intake-ui";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useHasPermission } from "@/hooks/use-has-permission";
import {
  useIntakePipelineTemplate,
  useSaveIntakePipelineSteps,
} from "@/hooks/use-intake-pipeline-template";
import { useRoleOptions } from "@/hooks/use-roles";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Menu,
  Portal,
  Skeleton,
  Stack,
  Switch,
  Text,
} from "@chakra-ui/react";
import { ArrowDown, ArrowUp, Plus, ShieldAlert, Trash2, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { STAGE_ORDER, stageLabel } from "./stages";

/**
 * A step in the editor's local draft.
 *
 * `key` is React identity only — it is never sent. A step loaded from the server
 * borrows its row id; a step the user just added has no row yet and gets a
 * counter value, minted in the click handler so nothing is generated during
 * render. Position is not usable as identity here: reordering and removing are
 * the two things this editor does.
 */
interface DraftStep extends IntakePipelineStepInput {
  key: string;
}

let nextKey = 0;
const newKey = () => `new-${nextKey++}`;

const toDraft = (step: IntakePipelineTemplateStep): DraftStep => ({
  key: step.id,
  title: step.title,
  description: step.description,
  pipelineStage: step.pipelineStage,
  isRequired: step.isRequired,
  assignableRoles: step.assignableRoles,
});

const toInput = ({ key: _key, ...step }: DraftStep): IntakePipelineStepInput => step;

export function IntakeChecklistPage() {
  useDocumentTitle("Intake checklist");
  const canRead = useHasPermission("workflow", "read");
  const canEdit = useHasPermission("workflow", "update");

  const template = useIntakePipelineTemplate(canRead);
  const roleOptions = useRoleOptions();
  const save = useSaveIntakePipelineSteps();

  const [draft, setDraft] = useState<DraftStep[] | null>(null);

  // The server list seeds the draft, and reseeds it after a save — the save
  // replaces every row, so its response is the new baseline. Adjusted during
  // render off a changed prop rather than in an effect, which is the pattern
  // React documents for exactly this: no cascading second render, and no
  // one-frame flash of the previous firm's checklist.
  const serverSteps = template.data?.steps;
  const [seededFrom, setSeededFrom] = useState(serverSteps);
  if (serverSteps !== seededFrom) {
    setSeededFrom(serverSteps);
    setDraft(serverSteps ? serverSteps.map(toDraft) : null);
  }

  const isDirty = useMemo(() => {
    if (!draft || !serverSteps) return false;
    return (
      JSON.stringify(draft.map(toInput)) !==
      JSON.stringify(serverSteps.map(toDraft).map(toInput))
    );
  }, [draft, serverSteps]);

  if (!canRead) {
    return (
      <Box pt="24px" maxW="760px">
        <SurfaceCard>
          <Flex direction="column" align="center" gap="8px" py="24px" textAlign="center">
            <Box color="fg.muted">
              <ShieldAlert size={28} />
            </Box>
            <Text fontWeight="600" color="fg">
              The intake checklist is restricted
            </Text>
            <Text fontSize="13px" color="fg.muted">
              You need workflow access to view how the firm's intake is set up.
            </Text>
          </Flex>
        </SurfaceCard>
      </Box>
    );
  }

  const usingSystemDefault = template.data?.organizationId === null;

  function update(key: string, patch: Partial<DraftStep>) {
    setDraft((steps) =>
      (steps ?? []).map((s) => (s.key === key ? { ...s, ...patch } : s)),
    );
  }

  function remove(key: string) {
    setDraft((steps) => (steps ?? []).filter((s) => s.key !== key));
  }

  function add(stage: PipelineStage) {
    setDraft((steps) => [
      ...(steps ?? []),
      {
        key: newKey(),
        title: "",
        description: "",
        pipelineStage: stage,
        isRequired: true,
        assignableRoles: [],
      },
    ]);
  }

  /**
   * Moves a step within its stage.
   *
   * Order is only ever meaningful inside a stage — the stages themselves are the
   * lead's fixed journey and cannot be reordered — so this swaps with the
   * neighbour that shares the stage, wherever it sits in the flat array.
   */
  function move(key: string, direction: -1 | 1) {
    setDraft((steps) => {
      if (!steps) return steps;
      const index = steps.findIndex((s) => s.key === key);
      if (index < 0) return steps;

      const stage = steps[index].pipelineStage;
      const neighbour =
        direction === -1
          ? [...steps.slice(0, index)].reverse().find((s) => s.pipelineStage === stage)
          : steps.slice(index + 1).find((s) => s.pipelineStage === stage);
      if (!neighbour) return steps;

      const swapped = [...steps];
      const neighbourIndex = steps.indexOf(neighbour);
      swapped[index] = neighbour;
      swapped[neighbourIndex] = steps[index];
      return swapped;
    });
  }

  const invalid = (draft ?? []).some((s) => !s.title.trim());

  return (
    <Box pt="24px" maxW="760px" pb="80px">
      <Flex justify="space-between" align="flex-start" gap="12px" wrap="wrap">
        <Box>
          <Text textStyle="heading">Intake checklist</Text>
          <Text color="fg.muted" mt="2px" fontSize="14px">
            The steps every new lead is given, and who each one goes to.
          </Text>
        </Box>
        {usingSystemDefault ? (
          <Badge size="sm" variant="surface" colorPalette="blue" fontSize="10px">
            Using the shared default
          </Badge>
        ) : null}
      </Flex>

      <Text color="fg.muted" mt="12px" fontSize="12px">
        Each step is auto-assigned to someone holding one of its roles when a lead
        arrives. Anyone can still be handed a specific step from the lead's intake
        tab afterwards. Changes apply to new leads — leads already in the pipeline
        keep the steps they were given.
      </Text>

      {template.isLoading || !draft ? (
        <Stack gap="12px" mt="20px">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} h="96px" borderRadius="10px" />
          ))}
        </Stack>
      ) : (
        <Stack gap="24px" mt="24px">
          {STAGE_ORDER.map((stage) => {
            const steps = draft.filter((s) => s.pipelineStage === stage);

            return (
              <Box key={stage}>
                <Text
                  fontSize="11px"
                  fontWeight="600"
                  color="fg.subtle"
                  textTransform="uppercase"
                  letterSpacing="0.5px"
                  mb="8px"
                >
                  {stageLabel(stage)}
                </Text>

                <Stack gap="8px">
                  {steps.map((step, i) => (
                    <StepCard
                      key={step.key}
                      step={step}
                      canEdit={canEdit}
                      roleOptions={roleOptions.data ?? []}
                      isFirst={i === 0}
                      isLast={i === steps.length - 1}
                      onChange={(patch) => update(step.key, patch)}
                      onMove={(direction) => move(step.key, direction)}
                      onRemove={() => remove(step.key)}
                    />
                  ))}

                  {canEdit ? (
                    <Button
                      variant="outline"
                      borderStyle="dashed"
                      borderColor="border.muted"
                      size="sm"
                      h="34px"
                      fontSize="12px"
                      color="fg.muted"
                      onClick={() => add(stage)}
                    >
                      <Plus size={13} />
                      Add a step to {stageLabel(stage).toLowerCase()}
                    </Button>
                  ) : null}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}

      {canEdit && isDirty ? (
        <Flex
          position="sticky"
          bottom="0"
          mt="24px"
          py="12px"
          gap="8px"
          justify="flex-end"
          bg="bg"
          borderTop="1px solid"
          borderColor="border"
        >
          <Button
            variant="outline"
            borderColor="border"
            size="sm"
            h="34px"
            fontSize="12px"
            onClick={() => setDraft((serverSteps ?? []).map(toDraft))}
            disabled={save.isPending}
          >
            Discard changes
          </Button>
          <Button
            bg="brand.solid"
            color="brand.contrast"
            _hover={{ bg: "brand.solid/90" }}
            size="sm"
            h="34px"
            fontSize="12px"
            loading={save.isPending}
            // An empty checklist would leave every future lead with no pipeline
            // at all, and the backend refuses it — say so here instead.
            disabled={invalid || (draft ?? []).length === 0}
            onClick={() => save.mutate((draft ?? []).map(toInput))}
          >
            {invalid ? "Every step needs a title" : "Save checklist"}
          </Button>
        </Flex>
      ) : null}
    </Box>
  );
}

function StepCard({
  step,
  canEdit,
  roleOptions,
  isFirst,
  isLast,
  onChange,
  onMove,
  onRemove,
}: {
  step: DraftStep;
  canEdit: boolean;
  roleOptions: { name: string; label: string }[];
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<DraftStep>) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const selectedRoles = step.assignableRoles ?? [];

  return (
    <Box border="1px solid" borderColor="border" borderRadius="10px" p="12px" bg="bg">
      <Flex gap="8px" align="flex-start">
        <Stack gap="4px" flex="1" minW={0}>
          <Input
            size="sm"
            h="32px"
            fontSize="13px"
            fontWeight="500"
            placeholder="Step title"
            value={step.title}
            readOnly={!canEdit}
            onChange={(e) => onChange({ title: e.target.value })}
          />
          <Input
            size="sm"
            h="30px"
            fontSize="12px"
            color="fg.muted"
            placeholder="What this step involves (optional)"
            value={step.description ?? ""}
            readOnly={!canEdit}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </Stack>

        {canEdit ? (
          <HStack gap="2px">
            <IconButton
              aria-label="Move step up"
              variant="ghost"
              size="xs"
              disabled={isFirst}
              onClick={() => onMove(-1)}
            >
              <ArrowUp size={13} />
            </IconButton>
            <IconButton
              aria-label="Move step down"
              variant="ghost"
              size="xs"
              disabled={isLast}
              onClick={() => onMove(1)}
            >
              <ArrowDown size={13} />
            </IconButton>
            <IconButton
              aria-label="Remove step"
              variant="ghost"
              size="xs"
              color="fg.muted"
              _hover={{ color: "red.fg" }}
              onClick={onRemove}
            >
              <Trash2 size={13} />
            </IconButton>
          </HStack>
        ) : null}
      </Flex>

      <Flex mt="10px" gap="10px" align="center" wrap="wrap" justify="space-between">
        <RolePicker
          selected={selectedRoles}
          options={roleOptions}
          disabled={!canEdit}
          onToggle={(role) =>
            onChange({
              assignableRoles: selectedRoles.includes(role)
                ? selectedRoles.filter((r) => r !== role)
                : [...selectedRoles, role],
            })
          }
        />

        <HStack gap="6px">
          <Text fontSize="11px" color="fg.muted">
            Required
          </Text>
          <Switch.Root
            checked={step.isRequired ?? true}
            disabled={!canEdit}
            onCheckedChange={(e) => onChange({ isRequired: e.checked })}
          >
            <Switch.HiddenInput />
            <Switch.Control bg={step.isRequired ?? true ? "brand.solid" : undefined}>
              <Switch.Thumb />
            </Switch.Control>
          </Switch.Root>
        </HStack>
      </Flex>
    </Box>
  );
}

/** Multi-select over the firm's roles — the same vocabulary the case workflow assigns by. */
function RolePicker({
  selected,
  options,
  disabled,
  onToggle,
}: {
  selected: string[];
  options: { name: string; label: string }[];
  disabled: boolean;
  onToggle: (role: string) => void;
}) {
  const labelFor = (name: string) =>
    options.find((o) => o.name === name)?.label ?? name.replace(/_/g, " ");

  return (
    <HStack gap="6px" wrap="wrap">
      <Menu.Root closeOnSelect={false}>
        <Menu.Trigger asChild>
          <Button
            variant="outline"
            borderColor="border"
            size="xs"
            h="26px"
            fontSize="11px"
            color="fg.muted"
            disabled={disabled}
          >
            <Users size={12} />
            Assign to
          </Button>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content minW="200px" maxH="260px" overflowY="auto">
              {options.length === 0 ? (
                <Menu.Item value="none" disabled>
                  No roles defined
                </Menu.Item>
              ) : (
                options.map((option) => (
                  <Menu.CheckboxItem
                    key={option.name}
                    value={option.name}
                    checked={selected.includes(option.name)}
                    onCheckedChange={() => onToggle(option.name)}
                  >
                    {option.label}
                    <Menu.ItemIndicator />
                  </Menu.CheckboxItem>
                ))
              )}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>

      {selected.length === 0 ? (
        <Text fontSize="11px" color="fg.muted">
          Left unassigned
        </Text>
      ) : (
        selected.map((role) => (
          <Badge key={role} size="sm" variant="surface" colorPalette="blue" fontSize="10px">
            {labelFor(role)}
          </Badge>
        ))
      )}
    </HStack>
  );
}
