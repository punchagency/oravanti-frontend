import { Button, Flex, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ title, action, children }: SectionCardProps) {
  return (
    <Flex direction="column" gap={2}>
      <Flex align="center" justify="space-between" minH="24px">
        <Text
          color="fg.subtle"
          fontSize="11px"
          fontWeight="500"
          letterSpacing="0.55px"
          textTransform="uppercase"
        >
          {title}
        </Text>
        {action}
      </Flex>
      {children}
    </Flex>
  );
}

export function SectionActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      size="2xs"
      variant="outline"
      borderColor="border"
      color="fg"
      fontSize="11px"
      fontWeight="500"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export function EmptyState({ children }: { children: string }) {
  return (
    <Text color="fg.muted" fontSize="12px">
      {children}
    </Text>
  );
}
