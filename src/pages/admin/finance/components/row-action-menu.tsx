import { Box, IconButton, Menu, Portal } from "@chakra-ui/react";
import { Ellipsis } from "lucide-react";
import type { ReactNode } from "react";

export type RowAction = {
  /** Also the menu item's value, so keep it unique within one row. */
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  /** Destructive actions are tinted so they read differently at a glance. */
  danger?: boolean;
};

/**
 * The finance tables' row actions, collapsed behind a single "…" trigger.
 *
 * A row's actions vary by status, so laid out inline they made the ACTION
 * column as wide as its longest pair of buttons ("Reschedule" + "Record
 * payment") for every row. One fixed-width trigger gives the money columns
 * that width back, and the menu can afford full labels the buttons had to
 * abbreviate.
 */
export function RowActionMenu({
  actions,
  ariaLabel = "Row actions",
}: {
  actions: RowAction[];
  ariaLabel?: string;
}) {
  if (actions.length === 0) return null;

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <IconButton
          aria-label={ariaLabel}
          variant="ghost"
          size="xs"
          color="fg.muted"
          _hover={{ color: "fg", bg: "bg.muted" }}
        >
          <Ellipsis size={15} />
        </IconButton>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="180px">
            {actions.map((action) => (
              <Menu.Item
                key={action.label}
                value={action.label}
                disabled={action.disabled}
                fontSize="13px"
                color={action.danger ? "fg.error" : undefined}
                _hover={
                  action.danger
                    ? { bg: "bg.error", color: "fg.error" }
                    : undefined
                }
                onClick={action.onSelect}
              >
                {action.icon}
                <Box flex="1">{action.label}</Box>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}
