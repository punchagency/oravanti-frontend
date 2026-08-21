import type { RoleSummary } from "@/api/roles-permissions";
import { useSetRoleColor } from "@/hooks/use-role-mutations";
import { roleColorValue } from "@/lib/role-colors";
import { ColorSwatchField } from "./color-swatch-field";

/** Persists immediately — used wherever an already-saved role's color is
 * shown (role cards, the view-permissions dialog). Role creation/editing
 * uses `ColorSwatchField` directly with local state instead, since the
 * role doesn't exist to persist a color against until it's saved. */
export function RoleColorPicker({ role }: { role: RoleSummary }) {
  const setColor = useSetRoleColor();

  return (
    <ColorSwatchField
      value={roleColorValue(role.color)}
      onChange={(color) => setColor.mutate({ roleName: role.name, color })}
    />
  );
}
