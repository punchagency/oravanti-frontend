import {
  useDeleteEmailAccount,
  useDisableEmailAccount,
  useEmailAccountList,
  useEnableEmailAccount,
} from "@/hooks/use-email-accounts";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useConfirmStore } from "@/store/confirm-store";
import {
  Badge,
  Box,
  Button,
  Center,
  HStack,
  Heading,
  IconButton,
  Separator,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  CheckCircle2,
  Mail,
  PlayCircle,
  Plug,
  PlugZap,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { providerColorPalette, providerLabel } from "../types";

type FilterTab = "all" | "active" | "disabled";

type EmailAccountListViewProps = {
  onConnect: () => void;
};

const tabs: { key: FilterTab; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "disabled", label: "Disabled" },
];

export function EmailAccountListView({ onConnect }: EmailAccountListViewProps) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const { showConfirm } = useConfirmDialog();
  const { data: emails = [] } = useEmailAccountList(filter);
  const enableMutation = useEnableEmailAccount();
  const disableMutation = useDisableEmailAccount();
  const deleteMutation = useDeleteEmailAccount();

  if (emails.length === 0 && filter === "all") {
    return (
      <Center
        layerStyle="surface-card"
        flexDir="column"
        gap="4"
        p={{ base: "8", md: "12" }}
        textAlign="center"
      >
        <PlugZap size={32} strokeWidth={1.5} />
        <Text textStyle="heading" color="fg">
          No email accounts connected yet
        </Text>
        <Text textStyle="body-sm" color="fg.muted" maxW="360px">
          Connect your personal email to start sending messages from within
          Oravanti.
        </Text>
        <Button
          layerStyle="brand-button"
          size={{ base: "sm", md: "md" }}
          onClick={onConnect}
        >
          <Plug size={15} />
          Connect an email account
        </Button>
      </Center>
    );
  }

  return (
    <Box layerStyle="surface-card" p={{ base: "3", md: "5" }}>
      <HStack
        justify="space-between"
        mb="4"
        flexDir={{ base: "column", sm: "row" }}
        gap={{ base: "2", sm: "0" }}
      >
        <Heading as="h2" size="sm" fontWeight="500" color="fg">
          Connected email accounts
        </Heading>
        <Button
          layerStyle="brand-button"
          size="sm"
          onClick={onConnect}
          w={{ base: "full", sm: "auto" }}
        >
          <Plug size={14} />
          Connect another
        </Button>
      </HStack>

      <HStack gap="1" mb="4" overflowX="auto" flexWrap="wrap">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            size="sm"
            variant={filter === tab.key ? "solid" : "ghost"}
            colorPalette={filter === tab.key ? "brand" : "gray"}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </HStack>

      <Separator borderColor="border.subtle" mb="2" />

      {emails.length === 0 ? (
        <Center py="8">
          <Text textStyle="body-sm" color="fg.muted">
            No {filter === "disabled" ? "disabled" : "active"} email accounts.
          </Text>
        </Center>
      ) : (
        <VStack gap="0" align="stretch">
          {emails.map((email) => (
            <Box key={email.id}>
              <HStack
                justify="space-between"
                py="3.5"
                gap="3"
                flexDir={{ base: "column", sm: "row" }}
                align={{ base: "stretch", sm: "center" }}
              >
                <HStack gap="3" minW="0">
                  <Center
                    w="9"
                    h="9"
                    borderRadius="md"
                    bg="bg.muted"
                    color="fg.muted"
                    flexShrink={0}
                  >
                    <Mail size={16} strokeWidth={1.8} />
                  </Center>
                  <Box minW="0">
                    <Text
                      textStyle="body-sm"
                      fontWeight="500"
                      color="fg"
                      truncate
                    >
                      {email.email}
                    </Text>
                    <HStack gap="1.5" flexWrap="wrap">
                      <Badge
                        colorPalette={providerColorPalette(email.provider)}
                      >
                        {providerLabel(email.provider)}
                      </Badge>
                      {!email.isActive && (
                        <Badge colorPalette="gray">Disabled</Badge>
                      )}
                    </HStack>
                  </Box>
                </HStack>
                <HStack gap="2.5" flexWrap="wrap">
                  <Badge
                    colorPalette={email.isActive ? "green" : "red"}
                    display="inline-flex"
                    alignItems="center"
                    gap="1"
                  >
                    {email.isActive ? (
                      <>
                        <CheckCircle2 size={12} /> Active
                      </>
                    ) : (
                      <>
                        <XCircle size={12} /> Inactive
                      </>
                    )}
                  </Badge>
                  {email.isActive ? (
                    <IconButton
                      variant="ghost"
                      color="fg.subtle"
                      size="sm"
                      aria-label="Disable"
                      title="Disable"
                      loading={
                        disableMutation.isPending &&
                        disableMutation.variables?.id === email.id
                      }
                      onClick={() =>
                        disableMutation.mutate({
                          id: email.id,
                          email: email.email,
                        })
                      }
                    >
                      <XCircle size={14} />
                    </IconButton>
                  ) : (
                    <IconButton
                      variant="ghost"
                      color="fg.subtle"
                      size="sm"
                      aria-label="Enable"
                      title="Enable"
                      loading={
                        enableMutation.isPending &&
                        enableMutation.variables?.id === email.id
                      }
                      onClick={() =>
                        enableMutation.mutate({
                          id: email.id,
                          email: email.email,
                        })
                      }
                    >
                      <PlayCircle size={14} />
                    </IconButton>
                  )}
                  <IconButton
                    variant="ghost"
                    color="fg.subtle"
                    size="sm"
                    aria-label="Remove permanently"
                    title="Remove permanently"
                    loading={
                      deleteMutation.isPending &&
                      deleteMutation.variables?.id === email.id
                    }
                    onClick={() =>
                      showConfirm({
                        title: "Remove email account",
                        description: `Are you sure you want to permanently remove ${email.email}? This action cannot be undone.`,
                        confirmLabel: "Delete",
                        cancelLabel: "Cancel",
                        onConfirm: () => {
                          useConfirmStore.getState().setLoading(true);
                          deleteMutation.mutate(
                            { id: email.id, email: email.email },
                            {
                              onSettled: () =>
                                useConfirmStore.getState().close(),
                            },
                          );
                        },
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </HStack>
              </HStack>
              <Separator borderColor="border.subtle" />
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}
