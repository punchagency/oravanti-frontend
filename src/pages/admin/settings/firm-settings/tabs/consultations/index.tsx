import { Box } from "@chakra-ui/react";
import { ConsultationFeeDefaults } from "../../components/consultation-fee-defaults";
import { ConsultationPaymentPolicy } from "../../components/consultation-payment-policy";

/**
 * Consultation policy — what a consultation costs and how it is paid for.
 *
 * Split out of General, which had accumulated firm identity, the snapshot, the
 * danger zone and consultation fees with nothing tying them together. Fees are
 * about to gain a payment schedule and a no-show policy, so they need a surface
 * of their own rather than a fourth card on a page about the firm's name.
 */
export default function ConsultationsTab() {
  return (
    <Box display="flex" flexDirection="column" gap="6" maxW="720px">
      <ConsultationFeeDefaults />
      <ConsultationPaymentPolicy />
    </Box>
  );
}
