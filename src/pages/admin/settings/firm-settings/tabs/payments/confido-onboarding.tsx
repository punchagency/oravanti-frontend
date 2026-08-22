import type { OnboardingSession } from "@/api/payment-settings";
import { useExternalScript } from "@/hooks/use-external-script";
import { useStartOnboardingSession } from "@/hooks/use-payment-settings";
import { brandGold } from "@/utils/design-tokens";
import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/**
 * Confido's onboarding form, embedded.
 *
 * The applicant stays on our domain for the whole KYC flow, including the
 * beneficial-owner step (`ownerInviteUrl` points back at us). Confido's own
 * styling hooks are limited to a colour ramp, so this is a themed Confido form
 * rather than our design system — worth knowing before anyone files a bug about
 * the inputs not matching.
 */

// ─── The SDK's surface, as far as we use it ─────────────────────────────────

type ConfidoChangeEvent = {
  type:
    | "loaded"
    | "saved"
    | "submitted"
    | "token_expired"
    | "token_expires_soon"
    | "error_on_load"
    | "error_on_save"
    | "error_on_submit"
    | "error_on_file_upload"
    | (string & {});
  errorMessage?: string;
};

type ConfidoOnboarding = {
  renderForm: (opts: {
    containerId: string;
    token: string;
    onChange?: (event: ConfidoChangeEvent) => void;
    style?: Record<string, unknown>;
    ownerInviteUrl?: string;
    disableOwnerInvite?: boolean;
    suppressLoadingSpinner?: boolean;
  }) => void;
};

declare global {
  interface Window {
    confidoOnboarding?: ConfidoOnboarding;
  }
}

/** Their `style` object wants a flat 50-900 hex ramp, which we already have. */
const CONFIDO_STYLE = {
  theme: { brandColors: brandGold },
  inputBackgroundColor: "#ffffff",
};

/**
 * `renderForm` takes a container **id**, not a node, and resolves it via
 * `getElementById` at call time. So the div must be in the DOM and stable —
 * hiding it behind a conditional would break the lookup.
 */
const CONTAINER_ID = "confido-onboarding-container";

type Props = { session: OnboardingSession; onSubmitted: () => void };

export function ConfidoOnboarding({ session, onSubmitted }: Props) {
  const scriptState = useExternalScript(session.scriptUrl, "confidoOnboarding");
  const [formLoaded, setFormLoaded] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  const startSession = useStartOnboardingSession();

  /**
   * A replacement token, fetched on the five-minute warning and held without
   * re-rendering. Re-rendering mid-form is the risky act; pre-fetching is not —
   * so when the token actually expires the gap is a paint, not a round trip.
   */
  const pendingToken = useRef<string | null>(null);
  const renderedToken = useRef<string | null>(null);

  const render = (token: string) => {
    const sdk = window.confidoOnboarding;
    const container = document.getElementById(CONTAINER_ID);
    if (!sdk || !container) return;

    // `renderForm` is not documented as idempotent, and calling it twice on a
    // populated div risks stacking iframes.
    container.innerHTML = "";
    renderedToken.current = token;

    sdk.renderForm({
      containerId: CONTAINER_ID,
      token,
      style: CONFIDO_STYLE,
      ownerInviteUrl: session.ownerInviteUrl,
      onChange: handleChange,
    });
  };

  const handleChange = (event: ConfidoChangeEvent) => {
    switch (event.type) {
      case "loaded":
        setFormLoaded(true);
        setFailed(null);
        break;

      case "submitted":
        // Underwriting has it now; the tab moves to "under review".
        onSubmitted();
        break;

      case "token_expires_soon":
        startSession.mutate(undefined, {
          onSuccess: (next) => {
            pendingToken.current = next.token;
          },
        });
        break;

      case "token_expired": {
        const next = pendingToken.current;
        pendingToken.current = null;
        if (next) {
          render(next);
        } else {
          // The pre-fetch did not land in time — fetch and re-render now.
          startSession.mutate(undefined, {
            onSuccess: (fresh) => render(fresh.token),
          });
        }
        break;
      }

      case "saved":
        // Progress is safe on Confido's side. Nothing to do, and a toast on
        // every autosave would be noise.
        break;

      default:
        if (event.type.startsWith("error_on_")) {
          // Surface it rather than leaving a form that looks fine and is not.
          // The event name is logged because the docs only give the prefix.
          console.error("[confido] onboarding error", event);
          setFailed(
            event.errorMessage ??
              "Something went wrong in the application form.",
          );
          toast.error(event.errorMessage ?? "Payment application error");
        }
    }
  };

  useEffect(() => {
    if (scriptState !== "ready") return;
    if (renderedToken.current === session.token) return;
    render(session.token);
    // `render` closes over the current session; re-running on token change is
    // exactly what we want and nothing else here is reactive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptState, session.token]);

  return (
    <Box>
      {scriptState === "error" && (
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          bg="bg"
          p="20px"
          mb="16px"
        >
          <Text textStyle="label" mb="4px">
            The application form could not load
          </Text>
          <Text fontSize="13px" color="fg.muted">
            This is usually a network problem, or this domain not yet being
            allowlisted with Confido. Try again, and contact support if it
            persists.
          </Text>
          <Button
            mt="12px"
            size="sm"
            layerStyle="brand-button"
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
        </Box>
      )}

      {failed && (
        <Box
          border="1px solid"
          borderColor="border"
          borderRadius="10px"
          p="16px"
          mb="16px"
        >
          <Text fontSize="13px" color="fg.error">
            {failed}
          </Text>
        </Box>
      )}

      {(scriptState === "loading" || !formLoaded) &&
        scriptState !== "error" && (
          <Flex align="center" gap="8px" mb="12px">
            <Text fontSize="13px" color="fg.muted">
              Loading the application form…
            </Text>
          </Flex>
        )}

      {/* Always mounted: renderForm resolves this by id at call time, so it
          cannot be behind a conditional. */}
      <Box id={CONTAINER_ID} minH={formLoaded ? "600px" : "0"} />
    </Box>
  );
}
