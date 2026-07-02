import {
  Box,
  Button,
  Checkbox,
  Flex,
  HStack,
  Portal,
  Select,
  Textarea,
} from "@chakra-ui/react";
import { Plus } from "lucide-react";
import { visibilityOptions } from "./data";

export function AddNoteCard() {
  return (
    <Box mb={4}>
      <Textarea
        placeholder="Add a case note... Use @name to mention a team member. Internal only."
        minH="80px"
        resize="vertical"
        variant="outline"
        borderColor="border"
        outline={"none"}
        _focus={{ borderColor: "brand.solid" }}
        mb={4}
        fontSize="13px"
        bg="bg"
      />

      {/* Bottom row */}
      <Flex justify="space-between" align="center" gap={4}>
        <Checkbox.Root size="sm" colorPalette="brand">
          <Checkbox.HiddenInput />
          <Checkbox.Control borderColor="border.emphasized" />
          <Checkbox.Label fontSize="12px" color="fg.muted">
            Pin this note
          </Checkbox.Label>
        </Checkbox.Root>

        <HStack gap={2}>
          <Select.Root
            collection={visibilityOptions}
            size="sm"
            defaultValue={["all"]}
            width="190px"
          >
            <Select.Control>
              <Select.Trigger>
                <Select.ValueText placeholder="Visibility" />
              </Select.Trigger>
              <Select.IndicatorGroup>
                <Select.Indicator />
              </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {visibilityOptions.items.map((option) => (
                    <Select.Item item={option} key={option.value}>
                      <Select.ItemText>{option.label}</Select.ItemText>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
            <Select.HiddenSelect />
          </Select.Root>

          <Button
            size="sm"
            bg="brand.solid"
            color="brand.contrast"
            fontSize="13px"
            fontWeight="500"
            _hover={{ bg: "brand.solid/90" }}
          >
            <Plus size={13} />
            Add note
          </Button>
        </HStack>
      </Flex>
    </Box>
  );
}
