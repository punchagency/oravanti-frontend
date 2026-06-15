import { useDocumentTitle } from "@/hooks/use-document-title";
import { Box, Heading, Text } from "@chakra-ui/react";
import { useState } from "react";
import { EmailAccountConnectFlow } from "./components/email-account-connect-flow";
import { EmailAccountListView } from "./components/email-account-list-view";

export function EmailAccountConnectionPage() {
  useDocumentTitle("Email Accounts - Oravanti");

  const [isOpen, setIsOpen] = useState(false);

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
          <Heading
            as="h1"
            size={{ base: "xl", md: "2xl" }}
            fontWeight="500"
            color="fg"
          >
            Email Accounts
          </Heading>
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
