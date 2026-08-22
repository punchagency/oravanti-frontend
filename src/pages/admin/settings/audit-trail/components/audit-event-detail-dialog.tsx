import type { AuditEvent } from "@/api/audit";
import { colorForCategory, labelForCategory, labelForDomain } from "@/lib/audit";
import {
  Badge,
  Box,
  Dialog,
  Flex,
  IconButton,
  Portal,
  ScrollArea,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Shield, X } from "lucide-react";

/**
 * Read-only detail view for a single audit event. One instance is shared
 * across the whole table (see `index.tsx`) rather than one per row — always
 * mounted, driven purely by `open`/`event`. `event` stays populated by the
 * caller until `onExitComplete` fires, so the dialog keeps showing the
 * selected event's content through the close animation instead of blanking
 * the instant a close is requested.
 */

function Field({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === "") return null;

  const isJson = typeof value === "object";
  const display = isJson ? JSON.stringify(value, null, 2) : String(value);

  return (
    <Box py="8px" borderBottom="1px solid" borderColor="border.muted" _last={{ borderBottom: "none" }}>
      <Text fontSize="11px" fontWeight="500" color="fg.muted" textTransform="uppercase" letterSpacing="0.4px" mb="4px">
        {label}
      </Text>
      <Text
        fontSize="12px"
        color="fg"
        fontFamily={isJson ? "mono" : "inherit"}
        whiteSpace={isJson ? "pre-wrap" : "normal"}
        wordBreak="break-word"
        lineHeight="1.5"
      >
        {display}
      </Text>
    </Box>
  );
}

function DialogBody({ event }: { event: AuditEvent }) {
  const occurred = new Date(event.occurredAt);

  return (
    <>
      <Dialog.CloseTrigger asChild>
        <IconButton
          aria-label="Close"
          position="absolute"
          top="22px"
          right="22px"
          size="xs"
          variant="outline"
          borderRadius="8px"
        >
          <X size={14} />
        </IconButton>
      </Dialog.CloseTrigger>

      <Box p="24px 24px 16px" borderBottom="1px solid" borderColor="border.muted">
        <Dialog.Title
          fontSize="16px"
          fontWeight="600"
          color="fg"
          display="flex"
          alignItems="center"
          gap="8px"
          pr="40px"
        >
          <Shield size={16} color="fg.subtle" />
          {event.label}
        </Dialog.Title>
        <Flex gap={2} mt="6px" align="center" wrap="wrap">
          <Badge size="sm" colorPalette={colorForCategory(event.category)} variant="subtle">
            {labelForCategory(event.category)}
          </Badge>
          <Badge size="sm" variant="outline" colorPalette={event.actionType === "delete" ? "red" : event.actionType === "create" ? "green" : "gray"}>
            {event.actionType}
          </Badge>
          <Text fontSize="11px" color="fg.muted">
            {occurred.toLocaleDateString()} at {occurred.toLocaleTimeString()}
          </Text>
        </Flex>
      </Box>

      <ScrollArea.Root flex="1" minH={0}>
        <ScrollArea.Viewport>
          <ScrollArea.Content>
            <VStack align="stretch" gap="0" p="12px 24px 24px">
              <Field label="Event" value={event.action} />
              <Field label="Summary" value={event.summary} />
              <Field label="Actor" value={event.actorName} />
              <Field label="Actor email" value={event.actorEmail} />
              <Field label="Actor type" value={event.actorType} />
              <Field label="Actor ID" value={event.actorId} />
              <Field label="Staff ID" value={event.actorStaffId} />
              <Field label="Entity type" value={labelForDomain(event.entityType)} />
              <Field label="Entity ID" value={event.entityId} />
              <Field label="Parent entity" value={event.parentEntityType ? `${event.parentEntityType} / ${event.parentEntityId}` : null} />
              <Field label="IP address" value={event.ipAddress} />
              <Field label="Source" value={event.source} />
              <Field label="Request ID" value={event.requestId} />
              <Field label="Before" value={event.before} />
              <Field label="After" value={event.after} />
              <Field label="Metadata" value={event.metadata} />
            </VStack>
          </ScrollArea.Content>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar orientation="vertical" />
        <ScrollArea.Corner />
      </ScrollArea.Root>
    </>
  );
}

export function AuditEventDetailDialog({
  event,
  open,
  onOpenChange,
  onExitComplete,
}: {
  event: AuditEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExitComplete: () => void;
}) {
  if (!event) return null;

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
      onExitComplete={onExitComplete}
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop backdropFilter="blur(1.5px)" />
        <Dialog.Positioner px="16px">
          <Dialog.Content
            w="full"
            maxW="600px"
            maxH="85vh"
            border="1px solid"
            borderColor="border"
            borderRadius="14px"
            bg="bg"
            p="0"
            boxShadow="0 24px 70px rgba(0, 0, 0, 0.26)"
            display="flex"
            flexDirection="column"
          >
            <DialogBody event={event} />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
