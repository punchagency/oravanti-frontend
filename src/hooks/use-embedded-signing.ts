import HelloSign from "hellosign-embedded";
import { useCallback, useEffect, useRef } from "react";

export type SignSession = { signUrl: string; clientId: string | null };

/**
 * Open a Dropbox Sign embedded signing modal.
 *
 * Extracted from the public client signing page once the firm's own signer
 * needed the same thing from inside the admin app. The two differ only in how
 * the session is fetched — the client's by an opaque token from their email,
 * the firm's by an authenticated request narrowed to the assigned signer — and
 * not at all in what the SDK does with it.
 *
 * The `sign` event is advisory. It fires locally the moment the iframe finishes,
 * while the provider's webhook — the only authoritative record — is still in
 * flight. Callers use it to move the UI optimistically and refetch, never to
 * conclude that the document is executed.
 */
export function useEmbeddedSigning(handlers: {
  onSigned?: () => void;
  onDeclined?: () => void;
  onClosed?: () => void;
}) {
  const clientRef = useRef<HelloSign | null>(null);
  // Held in a ref so `open` does not depend on identity-stable callbacks: it is
  // called from click handlers in components that re-render constantly, and a
  // callback that changed every render would rebuild the opener every render.
  // Written in an effect rather than during render — a ref write during render
  // is not safe under concurrent rendering, and the SDK events that read it can
  // only fire after the modal is open, which is well after paint.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  // Tear the client down on unmount, or the iframe outlives the component.
  useEffect(
    () => () => {
      clientRef.current?.close();
      clientRef.current = null;
    },
    [],
  );

  return useCallback((session: SignSession) => {
    const client = new HelloSign({
      clientId: session.clientId ?? undefined,
      // Dev and stub only — real embedded signing verifies the app's domains.
      skipDomainVerification: import.meta.env.DEV,
    });
    clientRef.current = client;

    client.on("sign", () => handlersRef.current.onSigned?.());
    client.on("decline", () => handlersRef.current.onDeclined?.());
    client.on("close", () => handlersRef.current.onClosed?.());

    client.open(session.signUrl, {
      skipDomainVerification: import.meta.env.DEV,
    });
  }, []);
}
