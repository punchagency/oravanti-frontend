import { Box } from "@chakra-ui/react";
import { FirmSignatureCard } from "../../components/firm-signature-card";

/**
 * Fee-agreement policy — who executes a retainer on the firm's side.
 *
 * Its own tab rather than a card under Consultations or Payments. The
 * consultation tab is about what a consultation costs, and the payments tab
 * returns early when no processor is connected — but a firm that takes cheques
 * still has to say who may bind it to a contract.
 */
export default function FeeAgreementsTab() {
  return (
    <Box display="flex" flexDirection="column" gap="6" maxW="720px">
      <FirmSignatureCard />
    </Box>
  );
}
