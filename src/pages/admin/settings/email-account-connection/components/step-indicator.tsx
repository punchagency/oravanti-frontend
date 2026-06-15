import { Box, Button, Center, HStack, Text } from "@chakra-ui/react";
import { ChevronLeft } from "lucide-react";

type StepIndicatorProps = {
  step: number;
  total: number;
  onBack: () => void;
  showBack?: boolean;
};

export function StepIndicator({ step, total, onBack, showBack = true }: StepIndicatorProps) {
  return (
    <>
      <HStack justify="space-between" mb="5">
        {showBack ? (
          <Button
            variant="ghost"
            size="sm"
            color="fg.muted"
            onClick={onBack}
            display="inline-flex"
            alignItems="center"
            gap="1"
          >
            <ChevronLeft size={16} />
            Back
          </Button>
        ) : (
          <Box />
        )}
        <Text textStyle="body-sm" fontWeight="500" color="fg.subtle">
          Step {step} of {total}
        </Text>
      </HStack>

      <HStack gap="2" mb="7">
        {Array.from({ length: total }, (_, i) => i + 1).map((i) => (
          <Box key={i} flex="1" display="flex" alignItems="center" gap="2">
            <Center
              w="7"
              h="7"
              borderRadius="full"
              border="2px solid"
              borderColor={step >= i ? "brand.solid" : "border"}
              bg={step >= i ? "brand.solid" : "transparent"}
              color={step >= i ? "brand.fg" : "fg.subtle"}
              fontSize="xs"
              fontWeight="500"
            >
              {i}
            </Center>
            {i < total && (
              <Box
                flex="1"
                h="0.5"
                borderRadius="full"
                bg={step > i ? "brand.solid" : "border.subtle"}
              />
            )}
          </Box>
        ))}
      </HStack>
    </>
  );
}
