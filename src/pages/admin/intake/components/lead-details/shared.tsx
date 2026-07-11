import { Box, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

export function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <Box borderBottom="1px solid" borderColor="border.muted" py={2}>
      <Text
        color="fg.subtle"
        fontSize="10px"
        fontWeight="500"
        letterSpacing="0.5px"
        textTransform="uppercase"
        mb={0.5}
      >
        {label}
      </Text>
      <Text color="fg" fontSize="12px" lineHeight="150%">
        {value}
      </Text>
    </Box>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Text
      color="fg.subtle"
      fontSize="11px"
      fontWeight="500"
      letterSpacing="0.55px"
      textTransform="uppercase"
      mb={2}
    >
      {children}
    </Text>
  );
}

