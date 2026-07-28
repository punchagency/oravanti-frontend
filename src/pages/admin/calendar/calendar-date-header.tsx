import { Box, Text } from "@chakra-ui/react";
import { dayjs } from "@/utils/date";
import isToday from "dayjs/plugin/isToday";

dayjs.extend(isToday);

function DateCircle({ date }: { date: Date }) {
  const d = dayjs(date);
  const today = d.isToday();

  return (
    <Box
      as="span"
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      w="28px"
      h="28px"
      borderRadius="50%"
      bg={today ? "var(--brand-cta)" : "transparent"}
      color={today ? "var(--brand-cta-text)" : "fg"}
      fontWeight={today ? 600 : 500}
      fontSize="13px"
    >
      {d.format("D")}
    </Box>
  );
}

export function MonthDateHeader({ date }: { date: Date }) {
  return <DateCircle date={date} />;
}

export function WeekDayHeader({ date }: { date: Date; label: string }) {
  const d = dayjs(date);
  const today = d.isToday();
  const dayName = d.format("ddd");
  const dayNum = d.format("D");

  return (
    <Box textAlign="center">
      <Text
        fontSize="10px"
        fontWeight={600}
        color={today ? "brand.solid" : "fg.muted"}
        textTransform="uppercase"
        letterSpacing="0.04em"
        mb="1px"
      >
        {dayName}
      </Text>
      <Text
        fontSize="16px"
        fontWeight={today ? 700 : 500}
        color={today ? "brand.solid" : "fg"}
        lineHeight={1}
      >
        {dayNum}
      </Text>
    </Box>
  );
}
