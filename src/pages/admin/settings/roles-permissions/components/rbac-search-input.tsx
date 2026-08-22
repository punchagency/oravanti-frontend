import { Box, Input } from "@chakra-ui/react";
import { Search } from "lucide-react";

/** Shared debounced-search text input for the RBAC tab filter bars.
 * Value/state lives in the tab's data context; this is display-only. */
export function RbacSearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (q: string) => void;
  placeholder: string;
}) {
  return (
    <Box position="relative" w="full" maxW={{ base: "full", md: "240px" }}>
      <Box
        position="absolute"
        left={3}
        top="50%"
        transform="translateY(-50%)"
        zIndex={1}
        color="fg.subtle"
        pointerEvents="none"
      >
        <Search size={14} />
      </Box>
      <Input
        size="sm"
        pl={9}
        placeholder={placeholder}
        bg="bg.input"
        borderColor="border.input"
        borderRadius="md"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </Box>
  );
}
