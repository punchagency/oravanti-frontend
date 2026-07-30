import { PageTitle } from "@/components/layout/navigation";
import { Box, Flex, HStack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";
import type { CalendarEventType } from "./types";
import { EVENT_TYPE_CONFIG } from "./types";

const FILTER_SUBTITLES: Record<string, string> = {
  master_calendar_hearing:
    "Filtered view — Master calendar hearing events only",
  individual_hearing: "Filtered view — Individual hearing events only",
  uscis_interview:
    "Filtered view — Government interview / meeting events only",
  biometric: "Filtered view — Biometric appointment events only",
  filing_deadline: "Filtered view — Filing deadline events only",
  service_request: "Filtered view — Service request events only",
  client_meeting: "Filtered view — Client meeting events only",
  internal_event: "Filtered view — Internal / staff events only",
};

interface CalendarHeaderProps {
  filter?: CalendarEventType;
  actions?: ReactNode;
}

export function CalendarHeader({ filter, actions }: CalendarHeaderProps) {
  const title = filter
    ? EVENT_TYPE_CONFIG[filter]?.label ?? "Calendar"
    : "Calendar & deadlines";
  const subtitle = filter
    ? FILTER_SUBTITLES[filter]
    : "All hearings, interviews, and filing deadlines across your practice areas";

  return (
    <Flex
      as="header"
      direction={{ base: "column", md: "row" }}
      align={{ base: "stretch", md: "center" }}
      justify="space-between"
      gap={{ base: "12px", md: "24px" }}
      py={{ base: "12px", md: "20px" }}
      pb={{ base: "12px", md: "20px" }}
      borderBottom="1px solid"
      borderColor="border.subtle"
    >
      <Box flex="1">
        <PageTitle>
          <Text
            as="h1"
            m="0"
            color="fg"
            fontSize={{ base: "18px", md: "24px" }}
            fontWeight="600"
            lineHeight="1.2"
          >
            {title}
          </Text>
        </PageTitle>
        <Text
          m={{ base: "4px 0 0", md: "8px 0 0" }}
          color="fg.muted"
          fontSize={{ base: "13px", md: "14px" }}
          display={{ base: "none", sm: "block" }}
        >
          {subtitle}
        </Text>
      </Box>
      {actions && (
        <HStack gap="12px" flexShrink="0">
          {actions}
        </HStack>
      )}
    </Flex>
  );
}
