import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Badge,
  Button,
  Tabs,
  Table,
  HStack,
  VStack,
  Avatar,
} from "@chakra-ui/react";
import {
  FileText,
  Upload,
  Download,
  Eye,
  ExternalLink,
  AlertTriangle,
  Clock,
  MessageSquare,
  FileCheck,
  File,
} from "lucide-react";

const STATS = [
  { label: "still needed", count: 4, color: "orange.400" },
  { label: "shared by your team", count: 3, color: "brand.solid" },
  { label: "uploaded by you", count: 4, color: "green.400" },
];

const DOCUMENT_REQUESTS = [
  {
    id: "1",
    type: "document",
    title: "Medical examination report (I-693)",
    description:
      "Required for your I-485 application. This must be completed by a USCIS-designated civil surgeon.",
    package: "I-485 Application Package",
    assignee: { name: "Sofia Reyes", initials: "SR" },
    dueDate: "Jun 21, 2026",
    overdue: true,
    urgent: true,
    badge: { label: "Urgent", color: "red" },
  },
  {
    id: "2",
    type: "document",
    title: "Updated passport copy",
    description:
      "We need a copy of your current passport. Your previous copy has an expiry conflict with your interview date.",
    package: "I-485 Application Package",
    assignee: { name: "Marcus Webb", initials: "MW" },
    dueDate: "Jun 20, 2026",
    overdue: true,
    urgent: true,
    badge: { label: "Urgent", color: "red" },
  },
];

const FORM_REQUESTS = [
  {
    id: "3",
    type: "questionnaire",
    title: "I-485 detailed questionnaire",
    description:
      "A detailed questionnaire to help us prepare your I-485 application. Please answer all questions as accurately as possible.",
    assignee: { name: "Sofia Reyes", initials: "SR" },
    dueDate: "Jun 25, 2026",
    meta: "4 sections / 16 questions",
    badge: { label: "Questionnaire", color: "blue" },
  },
];

const INFO_REQUESTS = [
  {
    id: "4",
    type: "information",
    title: "Employment gap clarification",
    description:
      "Please provide details about your employment between January 2021 and March 2022. We need this to complete your application accurately.",
    assignee: { name: "Sofia Reyes", initials: "SR" },
    dueDate: "Jun 26, 2026",
    badge: { label: "Information request", color: "purple" },
  },
];

const SHARED_DOCUMENTS = [
  {
    id: "s1",
    name: "Fee agreement draft",
    sharedBy: { name: "Marcus Webb", initials: "MW" },
    sharedDate: "Jun 16, 2026",
    category: "Legal document",
    size: "245 KB",
  },
  {
    id: "s2",
    name: "I-485 form instructions",
    sharedBy: { name: "Sofia Reyes", initials: "SR" },
    sharedDate: "Jun 18, 2026",
    category: "Guidance",
    size: "128 KB",
  },
  {
    id: "s3",
    name: "Interview preparation checklist",
    sharedBy: { name: "Marcus Webb", initials: "MW" },
    sharedDate: "Jun 20, 2026",
    category: "Checklist",
    size: "52 KB",
  },
];

type SubmissionStatus = "accepted" | "needs_attention" | "reviewing" | "pending";

interface SubmissionItem {
  id: string;
  name: string;
  uploadedDate: string;
  status: SubmissionStatus;
  statusLabel: string;
  notes: string | null;
  size: string;
  actions: string[];
}

const MY_SUBMISSIONS: SubmissionItem[] = [
  {
    id: "m1",
    name: "Passport copy (original)",
    uploadedDate: "Jun 12, 2026",
    status: "needs_attention",
    statusLabel: "Needs attention",
    notes: "This passport copy shows an expiry date before your interview. Please upload an updated copy.",
    size: "1.2 MB",
    actions: ["view", "upload_revised"],
  },
  {
    id: "m2",
    name: "Birth certificate",
    uploadedDate: "Jun 12, 2026",
    status: "accepted",
    statusLabel: "Accepted",
    notes: "Accepted by Sofia Reyes",
    size: "856 KB",
    actions: ["view"],
  },
  {
    id: "m3",
    name: "2 passport photos",
    uploadedDate: "Jun 12, 2026",
    status: "accepted",
    statusLabel: "Accepted",
    notes: "Accepted by Sofia Reyes",
    size: "345 KB",
    actions: ["view"],
  },
  {
    id: "m4",
    name: "Employment verification letter",
    uploadedDate: "Jun 15, 2026",
    status: "reviewing",
    statusLabel: "Being reviewed",
    notes: null,
    size: "210 KB",
    actions: ["view"],
  },
];

interface CompletedForm {
  id: string;
  name: string;
  submittedDate: string;
  phase: string;
  status: SubmissionStatus;
  statusLabel: string;
}

const COMPLETED_FORMS: CompletedForm[] = [
  {
    id: "f1",
    name: "Intake questionnaire",
    submittedDate: "Jun 10, 2026",
    phase: "Intake",
    status: "accepted",
    statusLabel: "Accepted",
  },
];

function StatusBadge({
  status,
  label,
}: {
  status: "accepted" | "needs_attention" | "reviewing" | "pending";
  label: string;
}) {
  const config = {
    accepted: { bg: "green.500/15", color: "green.400", borderColor: "green.500/30" },
    needs_attention: { bg: "red.500/15", color: "red.400", borderColor: "red.500/30" },
    reviewing: { bg: "blue.500/15", color: "blue.400", borderColor: "blue.500/30" },
    pending: { bg: "orange.500/15", color: "orange.400", borderColor: "orange.500/30" },
  };
  const c = config[status];
  return (
    <Badge
      bg={c.bg}
      color={c.color}
      border="1px solid"
      borderColor={c.borderColor}
      fontSize="11px"
      fontWeight="500"
      px="8px"
      py="2px"
      borderRadius="full"
    >
      {label}
    </Badge>
  );
}

function SectionHeader({
  title,
  count,
  countLabel,
}: {
  title: string;
  count?: number;
  countLabel?: string;
}) {
  return (
    <Flex align="center" gap="2" mb="3">
      <Text
        fontSize="13px"
        fontWeight="600"
        color="fg"
      >
        {title}
      </Text>
      {count !== undefined && (
        <Badge
          size="sm"
          variant="subtle"
          colorPalette="orange"
          fontSize="10px"
          fontWeight="500"
        >
          {count} {countLabel || "pending"}
        </Badge>
      )}
    </Flex>
  );
}

function DocumentRequestCard({ request }: { request: (typeof DOCUMENT_REQUESTS)[0] }) {
  return (
    <Box
      border="1px solid"
      borderColor={request.overdue ? "red.500/30" : "border"}
      borderRadius="10px"
      p="16px"
      bg="bg"
    >
      <Flex justify="space-between" align="flex-start" mb="2">
        <Flex gap="10px" align="flex-start">
          <Box
            w="28px"
            h="28px"
            borderRadius="6px"
            bg="bg.muted"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
            mt="1px"
          >
            <FileText size={14} color="fg.muted" />
          </Box>
          <Box>
            <Text fontSize="14px" fontWeight="600" color="fg">
              {request.title}
            </Text>
            <Text fontSize="13px" color="fg.muted" mt="1" lineHeight="1.5">
              {request.description}
            </Text>
          </Box>
        </Flex>
        <Badge
          colorPalette={request.badge.color}
          size="sm"
          variant="subtle"
          fontSize="10px"
          fontWeight="500"
          flexShrink={0}
        >
          {request.badge.label}
        </Badge>
      </Flex>

      <Flex align="center" gap="3" mt="3" mb="4" flexWrap="wrap">
        <HStack gap="1">
          <File size={11} color="fg.subtle" />
          <Text fontSize="11px" color="fg.subtle">{request.package}</Text>
        </HStack>
        <HStack gap="1">
          <Avatar.Root size="2xs" shape="rounded">
            <Avatar.Fallback name={request.assignee.name} />
          </Avatar.Root>
          <Text fontSize="11px" color="fg.subtle">{request.assignee.name}</Text>
        </HStack>
        <HStack gap="1">
          <Clock size={11} color={request.overdue ? "red.400" : "fg.subtle"} />
          <Text fontSize="11px" color={request.overdue ? "red.400" : "fg.subtle"}>
            Due {request.dueDate}
          </Text>
        </HStack>
      </Flex>

      <Flex justify="space-between" align="center">
        <Button
          size="sm"
          layerStyle="brand-button"
          fontSize="12px"
          h="32px"
          px="12px"
          gap="1.5"
        >
          <Upload size={13} />
          Upload {request.title.split(" (")[0]}
        </Button>
        {request.overdue && (
          <Text fontSize="11px" color="red.400" fontWeight="500">
            This document is overdue
          </Text>
        )}
      </Flex>
    </Box>
  );
}

function FormRequestCard({ request }: { request: (typeof FORM_REQUESTS)[0] }) {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      p="16px"
      bg="bg"
    >
      <Flex justify="space-between" align="flex-start" mb="2">
        <Flex gap="10px" align="flex-start">
          <Box
            w="28px"
            h="28px"
            borderRadius="6px"
            bg="bg.muted"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
            mt="1px"
          >
            <FileCheck size={14} color="fg.muted" />
          </Box>
          <Box>
            <Text fontSize="14px" fontWeight="600" color="fg">
              {request.title}
            </Text>
            <Text fontSize="13px" color="fg.muted" mt="1" lineHeight="1.5">
              {request.description}
            </Text>
          </Box>
        </Flex>
        <Badge
          colorPalette={request.badge.color}
          size="sm"
          variant="subtle"
          fontSize="10px"
          fontWeight="500"
          flexShrink={0}
        >
          {request.badge.label}
        </Badge>
      </Flex>

      <Flex align="center" gap="3" mt="3" mb="4" flexWrap="wrap">
        <HStack gap="1">
          <Avatar.Root size="2xs" shape="rounded">
            <Avatar.Fallback name={request.assignee.name} />
          </Avatar.Root>
          <Text fontSize="11px" color="fg.subtle">{request.assignee.name}</Text>
        </HStack>
        <HStack gap="1">
          <Clock size={11} color="fg.subtle" />
          <Text fontSize="11px" color="fg.subtle">Due {request.dueDate}</Text>
        </HStack>
        <Text fontSize="11px" color="fg.subtle">{request.meta}</Text>
      </Flex>

      <Button
        size="sm"
        layerStyle="brand-button"
        fontSize="12px"
        h="32px"
        px="12px"
      >
        Complete form
      </Button>
    </Box>
  );
}

function InfoRequestCard({ request }: { request: (typeof INFO_REQUESTS)[0] }) {
  return (
    <Box
      border="1px solid"
      borderColor="border"
      borderRadius="10px"
      p="16px"
      bg="bg"
    >
      <Flex justify="space-between" align="flex-start" mb="2">
        <Flex gap="10px" align="flex-start">
          <Box
            w="28px"
            h="28px"
            borderRadius="6px"
            bg="bg.muted"
            display="flex"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
            mt="1px"
          >
            <MessageSquare size={14} color="fg.muted" />
          </Box>
          <Box>
            <Text fontSize="14px" fontWeight="600" color="fg">
              {request.title}
            </Text>
            <Text fontSize="13px" color="fg.muted" mt="1" lineHeight="1.5">
              {request.description}
            </Text>
          </Box>
        </Flex>
        <Badge
          colorPalette={request.badge.color}
          size="sm"
          variant="subtle"
          fontSize="10px"
          fontWeight="500"
          flexShrink={0}
        >
          {request.badge.label}
        </Badge>
      </Flex>

      <Flex align="center" gap="3" mt="3" mb="4" flexWrap="wrap">
        <HStack gap="1">
          <Avatar.Root size="2xs" shape="rounded">
            <Avatar.Fallback name={request.assignee.name} />
          </Avatar.Root>
          <Text fontSize="11px" color="fg.subtle">{request.assignee.name}</Text>
        </HStack>
        <HStack gap="1">
          <Clock size={11} color="fg.subtle" />
          <Text fontSize="11px" color="fg.subtle">Due {request.dueDate}</Text>
        </HStack>
      </Flex>

      <Button
        size="sm"
        layerStyle="brand-button"
        fontSize="12px"
        h="32px"
        px="12px"
      >
        Respond
      </Button>
    </Box>
  );
}

function SharedDocumentRow({ doc }: { doc: (typeof SHARED_DOCUMENTS)[0] }) {
  return (
    <Flex
      p="12px 16px"
      gap="12px"
      align="center"
      borderBottom="1px solid"
      borderColor="border.muted"
      _last={{ borderBottom: "none" }}
    >
      <Box
        w="32px"
        h="32px"
        borderRadius="8px"
        bg="bg.muted"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        <FileText size={15} color="fg.muted" />
      </Box>
      <Box flex="1" minW={0}>
        <Text fontSize="13px" fontWeight="500" color="fg">
          {doc.name}
        </Text>
        <Flex gap="2" align="center" mt="0.5">
          <Text fontSize="11px" color="fg.subtle">
            {doc.category}
          </Text>
          <Text fontSize="11px" color="fg.subtle">·</Text>
          <Text fontSize="11px" color="fg.subtle">
            {doc.size}
          </Text>
        </Flex>
      </Box>
      <Flex gap="2" align="center" flexShrink={0}>
        <Avatar.Root size="2xs" shape="rounded">
          <Avatar.Fallback name={doc.sharedBy.name} />
        </Avatar.Root>
        <Text fontSize="11px" color="fg.subtle">{doc.sharedBy.name}</Text>
      </Flex>
      <Text fontSize="11px" color="fg.subtle" whiteSpace="nowrap" flexShrink={0}>
        {doc.sharedDate}
      </Text>
      <Button
        size="xs"
        variant="outline"
        color="fg"
        fontSize="11px"
        h="28px"
        px="10px"
        gap="1"
        flexShrink={0}
      >
        <Download size={12} /> Download
      </Button>
    </Flex>
  );
}

function SubmissionRow({ sub }: { sub: SubmissionItem }) {
  return (
    <Table.Row
      borderBottom="1px solid"
      borderColor="border.muted"
      _last={{ borderBottom: "none" }}
      bg={sub.status === "needs_attention" ? "red.500/5" : "transparent"}
    >
      <Table.Cell py="12px" verticalAlign="top">
        <Text fontSize="13px" fontWeight="500" color="fg">
          {sub.name}
        </Text>
        <Text fontSize="11px" color="fg.subtle" mt="0.5">
          {sub.size}
        </Text>
      </Table.Cell>
      <Table.Cell py="12px" verticalAlign="top">
        <Text fontSize="12px" color="fg.muted">
          {sub.uploadedDate}
        </Text>
      </Table.Cell>
      <Table.Cell py="12px" verticalAlign="top">
        <StatusBadge status={sub.status} label={sub.statusLabel} />
      </Table.Cell>
      <Table.Cell py="12px" verticalAlign="top">
        {sub.notes ? (
          <Flex gap="1" align="flex-start">
            {sub.status === "needs_attention" && (
              <Box mt="2px" flexShrink={0}>
                <AlertTriangle size={12} color="red.400" />
              </Box>
            )}
            <Text
              fontSize="12px"
              color={sub.status === "needs_attention" ? "red.400" : "fg.muted"}
              lineHeight="1.4"
            >
              {sub.notes}
            </Text>
          </Flex>
        ) : (
          <Text fontSize="12px" color="fg.subtle">—</Text>
        )}
      </Table.Cell>
      <Table.Cell py="12px" verticalAlign="top">
        <Flex gap="2" flexShrink={0}>
          <Button
            size="xs"
            variant="outline"
            color="fg"
            fontSize="11px"
            h="28px"
            px="10px"
            gap="1"
          >
            <Eye size={12} /> View
          </Button>
          {sub.actions.includes("upload_revised") && (
            <Button
              size="xs"
              variant="outline"
              color="fg"
              fontSize="11px"
              h="28px"
              px="10px"
              gap="1"
            >
              <Upload size={12} /> Upload revised
            </Button>
          )}
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}

function CompletedFormRow({ form }: { form: CompletedForm }) {
  return (
    <Table.Row
      borderBottom="1px solid"
      borderColor="border.muted"
      _last={{ borderBottom: "none" }}
    >
      <Table.Cell py="12px">
        <Flex gap="2" align="center">
          <FileCheck size={14} color="fg.muted" />
          <Text fontSize="13px" fontWeight="500" color="fg">
            {form.name}
          </Text>
        </Flex>
      </Table.Cell>
      <Table.Cell py="12px">
        <Text fontSize="12px" color="fg.muted">
          {form.submittedDate}
        </Text>
      </Table.Cell>
      <Table.Cell py="12px">
        <Badge
          size="sm"
          variant="subtle"
          colorPalette="gray"
          fontSize="10px"
          fontWeight="500"
        >
          {form.phase}
        </Badge>
      </Table.Cell>
      <Table.Cell py="12px">
        <StatusBadge status={form.status} label={form.statusLabel} />
      </Table.Cell>
      <Table.Cell py="12px">
        <Flex gap="2">
          <Button
            size="xs"
            variant="outline"
            color="fg"
            fontSize="11px"
            h="28px"
            px="10px"
            gap="1"
          >
            <Download size={12} /> Download PDF
          </Button>
          <Button
            size="xs"
            variant="outline"
            color="fg"
            fontSize="11px"
            h="28px"
            px="10px"
            gap="1"
          >
            <ExternalLink size={12} /> View responses
          </Button>
        </Flex>
      </Table.Cell>
    </Table.Row>
  );
}

export default function CaseFilesPage() {
  const [activeTab, setActiveTab] = useState("requests");

  return (
    <Box maxW="960px">
      {/* Header */}
      <Box mb="6">
        <Text fontSize="22px" fontWeight="600" color="fg" mb="1">
          My case files
        </Text>
        <Text fontSize="13px" color="fg.muted">
          Everything your legal team has shared and requested
        </Text>
      </Box>

      {/* Stats Bar */}
      <Flex
        border="1px solid"
        borderColor="border"
        borderRadius="10px"
        bg="bg"
        mb="6"
        overflow="hidden"
      >
        {STATS.map((stat, i) => (
          <Flex
            key={stat.label}
            flex="1"
            p="14px 16px"
            gap="6px"
            align="center"
            borderRight={i < STATS.length - 1 ? "1px solid" : "none"}
            borderColor="border"
          >
            <Text fontSize="20px" fontWeight="700" color={stat.color}>
              {stat.count}
            </Text>
            <Text fontSize="12px" color="fg.muted">
              {stat.label}
            </Text>
          </Flex>
        ))}
      </Flex>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value)}>
        <Tabs.List
          borderBottom="1px solid"
          borderColor="border.muted"
          gap={5}
          mb="6"
        >
          <Tabs.Trigger
            value="requests"
            textStyle="label"
            color="fg.muted"
            pb="10px"
            px={0}
            borderRadius="none"
            whiteSpace="nowrap"
            borderBottom="2px solid transparent"
            _selected={{
              borderBottom: "2px solid",
              borderColor: "brand.solid",
              color: "fg",
            }}
            _hover={{ color: "fg" }}
            transition="all 0.2s"
            gap="1.5"
          >
            Requests
            <Badge
              size="sm"
              colorPalette="brand"
              variant="subtle"
              fontSize="10px"
              fontWeight="500"
              borderRadius="full"
            >
              4
            </Badge>
          </Tabs.Trigger>
          <Tabs.Trigger
            value="shared"
            textStyle="label"
            color="fg.muted"
            pb="10px"
            px={0}
            borderRadius="none"
            whiteSpace="nowrap"
            borderBottom="2px solid transparent"
            _selected={{
              borderBottom: "2px solid",
              borderColor: "brand.solid",
              color: "fg",
            }}
            _hover={{ color: "fg" }}
            transition="all 0.2s"
            gap="1.5"
          >
            Shared with you
            <Box w="6px" h="6px" borderRadius="full" bg="blue.400" />
          </Tabs.Trigger>
          <Tabs.Trigger
            value="submissions"
            textStyle="label"
            color="fg.muted"
            pb="10px"
            px={0}
            borderRadius="none"
            whiteSpace="nowrap"
            borderBottom="2px solid transparent"
            _selected={{
              borderBottom: "2px solid",
              borderColor: "brand.solid",
              color: "fg",
            }}
            _hover={{ color: "fg" }}
            transition="all 0.2s"
            gap="1.5"
          >
            My submissions
            <Badge
              size="sm"
              colorPalette="red"
              variant="subtle"
              fontSize="10px"
              fontWeight="500"
              borderRadius="full"
            >
              1
            </Badge>
          </Tabs.Trigger>
        </Tabs.List>

        {/* Requests Tab */}
        <Tabs.Content value="requests">
          <VStack align="stretch" gap="6">
            {/* Document Requests */}
            <Box>
              <SectionHeader
                title="Documents requested"
                count={DOCUMENT_REQUESTS.length}
                countLabel="pending"
              />
              <VStack align="stretch" gap="3">
                {DOCUMENT_REQUESTS.map((req) => (
                  <DocumentRequestCard key={req.id} request={req} />
                ))}
              </VStack>
            </Box>

            {/* Forms to Complete */}
            <Box>
              <SectionHeader
                title="Forms to complete"
                count={FORM_REQUESTS.length}
                countLabel="pending"
              />
              <VStack align="stretch" gap="3">
                {FORM_REQUESTS.map((req) => (
                  <FormRequestCard key={req.id} request={req} />
                ))}
              </VStack>
            </Box>

            {/* Information Requests */}
            <Box>
              <SectionHeader
                title="Information requests"
                count={INFO_REQUESTS.length}
                countLabel="pending"
              />
              <VStack align="stretch" gap="3">
                {INFO_REQUESTS.map((req) => (
                  <InfoRequestCard key={req.id} request={req} />
                ))}
              </VStack>
            </Box>
          </VStack>
        </Tabs.Content>

        {/* Shared with you Tab */}
        <Tabs.Content value="shared">
          <Box>
            <Text fontSize="14px" fontWeight="600" color="fg" mb="3">
              Documents shared by your team
            </Text>
            <Box
              border="1px solid"
              borderColor="border"
              borderRadius="10px"
              bg="bg"
              overflow="hidden"
            >
              {SHARED_DOCUMENTS.map((doc) => (
                <SharedDocumentRow key={doc.id} doc={doc} />
              ))}
            </Box>
          </Box>
        </Tabs.Content>

        {/* My Submissions Tab */}
        <Tabs.Content value="submissions">
          <VStack align="stretch" gap="6">
            {/* Uploaded Documents Table */}
            <Box>
              <Text fontSize="14px" fontWeight="600" color="fg" mb="3">
                Uploaded documents
              </Text>
              <Box
                border="1px solid"
                borderColor="border"
                borderRadius="10px"
                bg="bg"
                overflow="hidden"
              >
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row bg="bg.muted">
                      <Table.ColumnHeader
                        py="10px"
                        fontSize="10px"
                        fontWeight="600"
                        letterSpacing="0.05em"
                        color="fg.muted"
                        textTransform="uppercase"
                      >
                        Document
                      </Table.ColumnHeader>
                      <Table.ColumnHeader
                        py="10px"
                        fontSize="10px"
                        fontWeight="600"
                        letterSpacing="0.05em"
                        color="fg.muted"
                        textTransform="uppercase"
                      >
                        Uploaded
                      </Table.ColumnHeader>
                      <Table.ColumnHeader
                        py="10px"
                        fontSize="10px"
                        fontWeight="600"
                        letterSpacing="0.05em"
                        color="fg.muted"
                        textTransform="uppercase"
                      >
                        Status
                      </Table.ColumnHeader>
                      <Table.ColumnHeader
                        py="10px"
                        fontSize="10px"
                        fontWeight="600"
                        letterSpacing="0.05em"
                        color="fg.muted"
                        textTransform="uppercase"
                      >
                        Notes
                      </Table.ColumnHeader>
                      <Table.ColumnHeader
                        py="10px"
                        fontSize="10px"
                        fontWeight="600"
                        letterSpacing="0.05em"
                        color="fg.muted"
                        textTransform="uppercase"
                      >
                        Action
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {MY_SUBMISSIONS.map((sub) => (
                      <SubmissionRow key={sub.id} sub={sub} />
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </Box>

            {/* Completed Forms Table */}
            <Box>
              <Text fontSize="14px" fontWeight="600" color="fg" mb="3">
                Completed forms & questionnaires
              </Text>
              <Box
                border="1px solid"
                borderColor="border"
                borderRadius="10px"
                bg="bg"
                overflow="hidden"
              >
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row bg="bg.muted">
                      <Table.ColumnHeader
                        py="10px"
                        fontSize="10px"
                        fontWeight="600"
                        letterSpacing="0.05em"
                        color="fg.muted"
                        textTransform="uppercase"
                      >
                        Form
                      </Table.ColumnHeader>
                      <Table.ColumnHeader
                        py="10px"
                        fontSize="10px"
                        fontWeight="600"
                        letterSpacing="0.05em"
                        color="fg.muted"
                        textTransform="uppercase"
                      >
                        Submitted
                      </Table.ColumnHeader>
                      <Table.ColumnHeader
                        py="10px"
                        fontSize="10px"
                        fontWeight="600"
                        letterSpacing="0.05em"
                        color="fg.muted"
                        textTransform="uppercase"
                      >
                        Phase
                      </Table.ColumnHeader>
                      <Table.ColumnHeader
                        py="10px"
                        fontSize="10px"
                        fontWeight="600"
                        letterSpacing="0.05em"
                        color="fg.muted"
                        textTransform="uppercase"
                      >
                        Status
                      </Table.ColumnHeader>
                      <Table.ColumnHeader
                        py="10px"
                        fontSize="10px"
                        fontWeight="600"
                        letterSpacing="0.05em"
                        color="fg.muted"
                        textTransform="uppercase"
                      >
                        Action
                      </Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {COMPLETED_FORMS.map((form) => (
                      <CompletedFormRow key={form.id} form={form} />
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </Box>
          </VStack>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
