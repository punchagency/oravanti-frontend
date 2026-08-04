import { Box, chakra, Stack, Text } from "@chakra-ui/react";
import { creatorGroups } from "../data";

export function DocumentTypeList({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (value: string) => void;
}) {
  return (
    <Box
      bg="bg"
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      p="18px"
      h="fit-content"
    >
      <Text fontSize="15px" fontWeight="600" color="fg">
        Select document type
      </Text>

      <Stack gap="0" mt="12px">
        {creatorGroups.map((group) => (
          <Box key={group.label} _notFirst={{ mt: "18px" }}>
            <Text
              fontSize="10px"
              fontWeight="600"
              letterSpacing="0.06em"
              color="fg.subtle"
              textTransform="uppercase"
            >
              {group.label}
            </Text>
            <Stack gap="2px" mt="6px">
              {group.types.map((type) => {
                const active = selected === type.value;
                return (
                  <chakra.button
                    key={type.value}
                    type="button"
                    textAlign="left"
                    px="10px"
                    py="8px"
                    borderRadius="7px"
                    borderLeft="2px solid"
                    borderColor={active ? "brand.solid" : "transparent"}
                    bg={active ? "brand.100" : "transparent"}
                    color={active ? "fg" : "fg.muted"}
                    fontSize="13px"
                    fontWeight={active ? 500 : 400}
                    _hover={{ bg: active ? "brand.100" : "bg.muted", color: "fg" }}
                    transition="all 150ms"
                    onClick={() => onSelect(type.value)}
                  >
                    {type.label}
                  </chakra.button>
                );
              })}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
