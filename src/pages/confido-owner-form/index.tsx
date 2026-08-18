import { useExternalScript } from "@/hooks/use-external-script";
import { brandGold } from "@/utils/design-tokens";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { Box, Center, Flex, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";

/**
 * The beneficial-owner form, hosted on our domain.
 *
 * Anyone owning more than 25% of the firm has to supply personal information for
 * underwriting, and they are often not the person who filled in the application
 * — so the applicant generates a link and sends it on. By default that link
 * points at Confido; passing `ownerInviteUrl` points it here instead, which
 * keeps the whole flow on one domain.
 *
 * Public by necessity: a beneficial owner is not a user of ours and has no
 * login. The `o_code` in the URL is the credential, which is why this page shows
 * nothing without one.
 */

type ConfidoOwnerChangeEvent = { type: string; errorMessage?: string };

type ConfidoOnboardingSdk = {
  renderOwnerForm: (opts: {
    code: string;
    containerId: string;
    onChange?: (e: ConfidoOwnerChangeEvent) => void;
    style?: Record<string, unknown>;
  }) => void;
};

const CONTAINER_ID = "confido-owner-form-container";

/**
 * The SDK URL is served with the onboarding session for signed-in admins, but
 * this page has no session to read it from. Vite's env is the only source
 * available here.
 */
const SCRIPT_URL =
  import.meta.env.VITE_CONFIDO_ONBOARDING_JS_URL ??
  "https://js.sandbox.gravity-legal.com/onboarding.js";

export function ConfidoOwnerFormPage() {
  useDocumentTitle("Owner information - Oravanti");

  const [params] = useSearchParams();
  const code = params.get("o_code");

  const scriptState = useExternalScript(
    code ? SCRIPT_URL : null,
    "confidoOnboarding",
  );
  const [submitted, setSubmitted] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const rendered = useRef(false);

  useEffect(() => {
    if (scriptState !== "ready" || !code || rendered.current) return;

    const sdk = window.confidoOnboarding as unknown as ConfidoOnboardingSdk;
    const container = document.getElementById(CONTAINER_ID);
    if (!sdk?.renderOwnerForm || !container) return;

    rendered.current = true;
    sdk.renderOwnerForm({
      code,
      containerId: CONTAINER_ID,
      style: { theme: { brandColors: brandGold }, inputBackgroundColor: "#fff" },
      onChange: (event) => {
        if (event.type === "submitted") setSubmitted(true);
        else if (event.type.startsWith("error_on_")) {
          console.error("[confido] owner form error", event);
          setFailed(event.errorMessage ?? "Something went wrong.");
        }
      },
    });
  }, [scriptState, code]);

  if (!code) {
    return (
      <Center minH="100vh" p="24px">
        <Box maxW="480px" textAlign="center">
          <Text textStyle="heading" mb="8px">
            This link is not valid
          </Text>
          <Text fontSize="14px" color="fg.muted">
            Owner information links are personal and time-limited. Ask whoever
            sent it to generate a new one.
          </Text>
        </Box>
      </Center>
    );
  }

  return (
    <Flex direction="column" align="center" minH="100vh" p="24px">
      <Box w="100%" maxW="720px">
        <Text textStyle="heading" mb="4px">
          Owner information
        </Text>
        <Text fontSize="14px" color="fg.muted" mb="20px">
          Your firm is setting up payment processing. Regulations require details
          for anyone owning more than 25% of the business.
        </Text>

        {submitted && (
          <Box
            border="1px solid"
            borderColor="border"
            borderRadius="10px"
            p="20px"
            mb="16px"
          >
            <Text fontSize="14px">
              Thank you — your information has been submitted. You can close this
              page.
            </Text>
          </Box>
        )}

        {scriptState === "error" && (
          <Text fontSize="13px" color="fg.error" mb="12px">
            The form could not load. Please try again shortly.
          </Text>
        )}

        {failed && (
          <Text fontSize="13px" color="fg.error" mb="12px">
            {failed}
          </Text>
        )}

        {/* Resolved by id at call time, so it stays mounted. */}
        <Box id={CONTAINER_ID} display={submitted ? "none" : "block"} />
      </Box>
    </Flex>
  );
}

export default ConfidoOwnerFormPage;
