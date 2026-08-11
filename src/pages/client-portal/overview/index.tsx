import {
  Box,
  Flex,
  Text,
  Badge,
  Button,
  SimpleGrid,
} from "@chakra-ui/react";
import {
  Plus,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const PROGRESS_STEPS = [
  { label: "Inquiry received", date: "Jun 5, 2026", done: true },
  { label: "Conflict check", date: "Jun 8, 2026", done: true },
  { label: "Questionnaire", date: "Jun 10, 2026", done: true },
  { label: "Consultation", date: "Jun 15, 2026", done: true },
  { label: "Fee agreement", date: "Jun 16, 2026", done: true },
  { label: "Case opened", date: "Jun 17, 2026", done: true },
  {
    label: "Documents filed",
    date: "Jun 19, 2026",
    done: true,
    current: true,
  },
  { label: "USCIS interview", date: "Jun 22, 2026", done: false },
  { label: "USCIS decision", date: "2 – 6 months", done: false },
  { label: "Case resolution", date: "After decision", done: false },
];

const NEXT_STEPS = [
  {
    step: 8,
    title: "USCIS interview",
    description:
      "Your USCIS interview is scheduled for Jun 22, 2026. Your attorney will help you prepare beforehand.",
    date: "Jun 22, 2026",
    icon: Calendar,
    accent: "brand.solid",
  },
  {
    step: 9,
    title: "USCIS decision",
    description:
      "After your interview, USCIS will review everything and make a decision. This typically takes 2 to 6 months.",
    date: "2 – 6 months",
    icon: Clock,
    accent: "fg.muted",
  },
  {
    step: 10,
    title: "Case resolution",
    description:
      "Once USCIS reaches a decision, your attorney will walk you through the outcome and next steps.",
    date: "After decision",
    icon: CheckCircle2,
    accent: "fg.muted",
  },
];

const RECENT_ACTIVITY = [
  {
    title: "Your documents were submitted to USCIS",
    description:
      "Your I-485 application package has been filed. We are waiting to hear back.",
    date: "Jun 19",
    icon: FileText,
    iconBg: "bg.muted",
    iconColor: "fg.muted",
  },
  {
    title: "Your USCIS interview has been scheduled",
    description:
      "Jun 22, 2026 at 10:00 AM. Your attorney will be in touch to prepare you.",
    date: "Jun 17",
    icon: Calendar,
    iconBg: "bg.muted",
    iconColor: "fg.muted",
  },
  {
    title: "Your case has been officially opened",
    description:
      "Welcome to Harrington & Cole LLP. Marcus Webb is your attorney for this matter.",
    date: "Jun 17",
    icon: CheckCircle2,
    iconBg: "bg.muted",
    iconColor: "fg.muted",
  },
  {
    title: "Fee agreement signed and received",
    description:
      "Thank you. Your signed agreement has been received and your payment confirmed.",
    date: "Jun 16",
    icon: CheckCircle2,
    iconBg: "bg.muted",
    iconColor: "fg.muted",
  },
  {
    title: "Intake questionnaire completed",
    description:
      "Your answers have been reviewed by your legal team. Thank you for completing it promptly.",
    date: "Jun 10",
    icon: CheckCircle2,
    iconBg: "bg.muted",
    iconColor: "fg.muted",
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function ClientOverviewPage() {
  const completedCount = PROGRESS_STEPS.filter((s) => s.done).length;
  const percentage = Math.round(
    (completedCount / PROGRESS_STEPS.length) * 100,
  );

  return (
    <Box maxW="960px">
      {/* Header */}
      <Flex
        justify="space-between"
        align="flex-start"
        direction={{ base: "column", md: "row" }}
        gap="4"
        mb="6"
      >
        <Box>
          <Text fontSize="22px" fontWeight="600" color="fg">
            Your case
          </Text>
          <Text fontSize="13px" color="fg.muted">
            Harrington & Cole LLP
          </Text>
        </Box>
        <Button layerStyle="brand-button" size="sm" rounded="md">
          <Plus size={15} /> New matter
        </Button>
      </Flex>

      {/* Welcome Card */}
      <Box
        border="1px solid"
        borderColor="border"
        borderRadius="10px"
        p="20px"
        mb="6"
        bg="bg"
      >
        <Text fontSize="18px" fontWeight="600" color="fg" mb="1">
          {getGreeting()}, Aisha.
        </Text>
        <Text fontSize="14px" color="fg.muted" mb="4">
          Here's a quick look at where things stand with your case.
        </Text>
        <Flex align="center" gap="2">
          <Text fontSize="13px" color="fg.subtle">
            Case{" "}
            <Text as="span" fontWeight="600" color="fg">
              ORV-2026-0131
            </Text>
          </Text>
          <Badge colorPalette="green" size="sm" variant="subtle">
            In progress
          </Badge>
        </Flex>
      </Box>

      {/* Status Cards */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap="4" mb="8">
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          p="16px"
          bg="bg"
        >
          <Flex justify="space-between" align="flex-start" mb="3">
            <Text fontSize="12px" fontWeight="500" color="fg.muted" textTransform="uppercase" letterSpacing="0.05em">
              Where things stand
            </Text>
            <Box w="28px" h="28px" borderRadius="8px" bg="bg.muted" display="flex" alignItems="center" justifyContent="center">
              <FileText size={14} color="fg.muted" />
            </Box>
          </Flex>
          <Text fontSize="16px" fontWeight="600" color="fg">
            Interview scheduled
          </Text>
          <Text fontSize="12px" color="fg.subtle" mt="1">
            Documents submitted Jun 19, 2026
          </Text>
        </Box>
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          p="16px"
          bg="bg"
        >
          <Flex justify="space-between" align="flex-start" mb="3">
            <Text fontSize="12px" fontWeight="500" color="fg.muted" textTransform="uppercase" letterSpacing="0.05em">
              Documents needed
            </Text>
            <Box w="28px" h="28px" borderRadius="8px" bg="orange.500/15" display="flex" alignItems="center" justifyContent="center">
              <AlertCircle size={14} color="orange.400" />
            </Box>
          </Flex>
          <Text fontSize="24px" fontWeight="700" color="fg">
            2
          </Text>
          <Text fontSize="12px" color="fg.subtle" mt="1">
            Please upload when ready
          </Text>
        </Box>
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          p="16px"
          bg="bg"
        >
          <Flex justify="space-between" align="flex-start" mb="3">
            <Text fontSize="12px" fontWeight="500" color="fg.muted" textTransform="uppercase" letterSpacing="0.05em">
              Next appointment
            </Text>
            <Box w="28px" h="28px" borderRadius="8px" bg="green.500/15" display="flex" alignItems="center" justifyContent="center">
              <Calendar size={14} color="green.400" />
            </Box>
          </Flex>
          <Text fontSize="24px" fontWeight="700" color="fg">
            Jun 22
          </Text>
          <Text fontSize="12px" color="fg.subtle" mt="1">
            USCIS interview – 10:00 AM
          </Text>
        </Box>
      </SimpleGrid>

      {/* Progress */}
      <Box mb="8">
        <Flex justify="space-between" align="center" mb="5">
          <Flex align="center" gap="2">
            <Text fontSize="16px" fontWeight="600" color="fg">
              Your progress
            </Text>
            <Text fontSize="13px" color="fg.subtle">
              Step {completedCount} of {PROGRESS_STEPS.length}
            </Text>
          </Flex>
          <Badge colorPalette="green" size="sm" variant="subtle">
            {percentage}% complete
          </Badge>
        </Flex>

        {/* Progress Bar */}
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          p="20px"
          bg="bg"
        >
          <Box position="relative" h="70px">
            {/* Background line */}
            <Box
              position="absolute"
              top="13px"
              left="20px"
              right="20px"
              h="2px"
              bg="border"
            />
            {/* Filled line */}
            <Box
              position="absolute"
              top="13px"
              left="20px"
              w={`calc(${(completedCount / PROGRESS_STEPS.length) * 100}% - 40px * ${completedCount / PROGRESS_STEPS.length})`}
              h="2px"
              bg="green.500"
              transition="width 0.5s ease"
            />

            {/* Steps */}
            <Flex justify="space-between" position="relative">
              {PROGRESS_STEPS.map((step, i) => (
                <Flex
                  key={i}
                  direction="column"
                  align="center"
                  gap="8px"
                  flex="1"
                >
                  <Box
                    w="26px"
                    h="26px"
                    borderRadius="full"
                    bg={
                      step.current
                        ? "green.500"
                        : step.done
                          ? "green.500"
                          : "bg"
                    }
                    color={step.done ? "white" : "fg.subtle"}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="10px"
                    fontWeight="600"
                    border={step.done ? "none" : "1px solid"}
                    borderColor="border"
                    position="relative"
                    zIndex={1}
                    boxShadow={step.current ? "0 0 0 3px green.500/20" : "none"}
                  >
                    {step.done && !step.current ? "✓" : i + 1}
                  </Box>
                  <Text
                    fontSize="9px"
                    fontWeight={step.done ? "500" : "400"}
                    color={step.done ? "fg" : "fg.subtle"}
                    textAlign="center"
                    whiteSpace="nowrap"
                    maxW="70px"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {step.label}
                  </Text>
                  <Text fontSize="8px" color="fg.subtle" textAlign="center">
                    {step.date}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </Box>
        </Box>
      </Box>

      {/* What happens next */}
      <Box mb="8">
        <Text fontSize="16px" fontWeight="600" color="fg" mb="4">
          What happens next
        </Text>
        <Flex direction="column" gap="3">
          {NEXT_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Flex
                key={step.step}
                border="1px solid"
                borderColor="border"
                borderRadius="10px"
                p="16px"
                gap="14px"
                bg="bg"
                align="flex-start"
              >
                <Box
                  w="32px"
                  h="32px"
                  borderRadius="8px"
                  bg="bg.muted"
                  color="fg.muted"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  <Icon size={16} />
                </Box>
                <Box flex="1">
                  <Flex justify="space-between" align="center" mb="1">
                    <Text fontSize="14px" fontWeight="600" color="fg">
                      {step.title}
                    </Text>
                    <Text fontSize="12px" color="fg.subtle" whiteSpace="nowrap">
                      Step {step.step}
                    </Text>
                  </Flex>
                  <Text fontSize="13px" color="fg.muted" lineHeight="1.5">
                    {step.description}
                  </Text>
                  <Text fontSize="12px" color="fg.subtle" mt="2">
                    {step.date}
                  </Text>
                </Box>
              </Flex>
            );
          })}
        </Flex>
      </Box>

      {/* Recent Activity */}
      <Box>
        <Flex justify="space-between" align="center" mb="4">
          <Text fontSize="16px" fontWeight="600" color="fg">
            Recent activity
          </Text>
          <Button
            variant="ghost"
            size="xs"
            color="brand.solid"
            fontWeight="500"
            fontSize="12px"
            gap="1"
            _hover={{ bg: "bg.subtle" }}
          >
            View full timeline <ArrowRight size={12} />
          </Button>
        </Flex>
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          bg="bg"
          overflow="hidden"
        >
          {RECENT_ACTIVITY.map((activity, i) => {
            const Icon = activity.icon;
            return (
              <Flex
                key={i}
                p="14px 16px"
                gap="12px"
                align="flex-start"
                borderBottom={i < RECENT_ACTIVITY.length - 1 ? "1px solid" : "none"}
                borderColor="border"
              >
                <Box
                  w="32px"
                  h="32px"
                  borderRadius="8px"
                  bg={activity.iconBg}
                  color={activity.iconColor}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                  mt="1px"
                >
                  <Icon size={15} />
                </Box>
                <Box flex="1" minW={0}>
                  <Text fontSize="13px" fontWeight="500" color="fg" lineHeight="1.4">
                    {activity.title}
                  </Text>
                  <Text fontSize="12px" color="fg.muted" mt="0.5" lineHeight="1.4">
                    {activity.description}
                  </Text>
                </Box>
                <Text fontSize="11px" color="fg.subtle" whiteSpace="nowrap" flexShrink={0} mt="1px">
                  {activity.date}
                </Text>
              </Flex>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}
