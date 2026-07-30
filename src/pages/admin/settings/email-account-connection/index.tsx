import { useDocumentTitle } from "@/hooks/use-document-title";
import { useFeedbackDialog } from "@/hooks/useFeedbackDialog";
import { PageTitle } from "@/components/layout/navigation";
import { Box, Heading, Text } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { EmailAccountConnectFlow } from "./components/email-account-connect-flow";
import { EmailAccountListView } from "./components/email-account-list-view";

export function EmailAccountConnectionPage() {
  useDocumentTitle("Email Accounts - Oravanti");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useFeedbackDialog();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const oauth = searchParams.get("oauth");
    if (!oauth) return;

    const message =
      searchParams.get("message") ||
      searchParams.get("error_description") ||
      searchParams.get("error") ||
      null;

    if (oauth === "success") {
      queryClient.invalidateQueries({ queryKey: ["email-accounts"] });
      showSuccess({
        title: "Email connected",
        description:
          message ?? "Your email account has been linked successfully.",
      });
    } else {
      showError({
        title: "Connection failed",
        description: message ?? "Failed to link your email account.",
      });
    }

    navigate("/settings/email-accounts", { replace: true });
  }, []);

  return (
    <Box px={{ base: "4", md: "6" }} maxW="3xl">
      <Box
        display="flex"
        alignItems="flex-start"
        justifyContent="space-between"
        gap="4"
        pt="8"
        mb="6"
        borderBottom="1px solid"
        borderColor="border.subtle"
      >
        <Box>
          <PageTitle>
            <Heading
              as="h1"
              size={{ base: "xl", md: "2xl" }}
              fontWeight="500"
              color="fg"
            >
              Email Accounts
            </Heading>
          </PageTitle>
          <Text textStyle="subheadline" color="fg.muted" mt="1">
            Connect your personal email to send messages from Oravanti
          </Text>
        </Box>
      </Box>

      <EmailAccountListView onConnect={() => setIsOpen(true)} />

      <EmailAccountConnectFlow
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
      />
    </Box>
  );
}
