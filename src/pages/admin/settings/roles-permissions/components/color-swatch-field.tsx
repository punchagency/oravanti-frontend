import { ROLE_COLOR_PRESETS, roleColorValue } from "@/lib/role-colors";
import { ColorPicker, HStack, parseColor } from "@chakra-ui/react";
import { Check } from "lucide-react";

/**
 * A controlled hex-color field built entirely on Chakra's `ColorPicker` —
 * preset swatches, a color area + hue/alpha sliders, an eyedropper, and a
 * hex text input all live inside the one component, rather than a
 * hand-rolled popover/native-input stand-in.
 *
 * Note: The Positioner is intentionally NOT portalled so the picker works
 * correctly inside Dialog components (Chakra docs recommend this).
 */
export function ColorSwatchField({
  value,
  onChange,
  disabled,
  triggerSize = "18px",
}: {
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
  triggerSize?: string;
}) {
  return (
    <ColorPicker.Root
      value={parseColor(roleColorValue(value))}
      onValueChange={(e) => onChange(e.value.toString("hex"))}
      disabled={disabled}
      size="xs"
    >
      <ColorPicker.HiddenInput />
      <ColorPicker.Control>
        <ColorPicker.Trigger
          data-fit-content
          rounded="full"
          border="1px solid"
          borderColor="border"
          p="2px"
        >
          <ColorPicker.ValueSwatch boxSize={triggerSize} rounded="full" />
        </ColorPicker.Trigger>
      </ColorPicker.Control>
      <ColorPicker.Positioner>
        <ColorPicker.Content>
          <ColorPicker.Area />
          <HStack>
            <ColorPicker.EyeDropper size="xs" variant="outline" />
            <ColorPicker.Sliders />
          </HStack>
          <ColorPicker.SwatchGroup>
            {ROLE_COLOR_PRESETS.map((c) => (
              <ColorPicker.SwatchTrigger key={c} value={c}>
                <ColorPicker.Swatch value={c} boxSize="18px">
                  <ColorPicker.SwatchIndicator>
                    <Check size={10} />
                  </ColorPicker.SwatchIndicator>
                </ColorPicker.Swatch>
              </ColorPicker.SwatchTrigger>
            ))}
          </ColorPicker.SwatchGroup>
          <ColorPicker.ChannelInput channel="hex" />
        </ColorPicker.Content>
      </ColorPicker.Positioner>
    </ColorPicker.Root>
  );
}
