import { useEffect, useState } from "react";

/**
 * Loads a third-party script at runtime and reports when its global is ready.
 *
 * New ground for this codebase: every other third-party embed here (HelloSign)
 * is an npm dependency, so nothing existed to extend. Confido's onboarding.js is
 * only distributed as a hosted bundle.
 *
 * Two details that are easy to get wrong:
 *
 *   - **Resolve on the global, not on `onload`.** A script can finish loading a
 *     tick before it finishes assigning its global, and calling into it in that
 *     gap throws.
 *   - **Never remove the tag on unmount.** Removing it does not undefine the
 *     global, so it buys nothing and guarantees a re-download next time. The
 *     container gets cleaned up instead; the script stays.
 */

export type ScriptState = "idle" | "loading" | "ready" | "error";

/**
 * One in-flight load per URL, shared across every caller.
 *
 * React StrictMode double-invokes effects in development and two components can
 * mount at once, either of which would otherwise append a second tag.
 */
const loaders = new Map<string, Promise<void>>();

const POLL_INTERVAL_MS = 50;
const GLOBAL_TIMEOUT_MS = 10_000;

/** Waits for the SDK to actually publish its global. */
const waitForGlobal = (globalKey: string): Promise<void> =>
  new Promise((resolve, reject) => {
    if (globalKey in window) return resolve();

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (globalKey in window) {
        window.clearInterval(timer);
        resolve();
      } else if (Date.now() - startedAt > GLOBAL_TIMEOUT_MS) {
        window.clearInterval(timer);
        reject(
          new Error(`${globalKey} did not appear after the script loaded`),
        );
      }
    }, POLL_INTERVAL_MS);
  });

const loadScript = (src: string, globalKey: string): Promise<void> => {
  const existing = loaders.get(src);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    // A tag may already be present from a previous mount, since we never remove
    // them. Reuse it rather than appending a duplicate.
    const alreadyThere = document.querySelector<HTMLScriptElement>(
      `script[data-external-src="${CSS.escape(src)}"]`,
    );

    if (alreadyThere) {
      waitForGlobal(globalKey).then(resolve).catch(reject);
      return;
    }

    const tag = document.createElement("script");
    tag.src = src;
    tag.async = true;
    tag.dataset.externalSrc = src;
    tag.onload = () => waitForGlobal(globalKey).then(resolve).catch(reject);
    tag.onerror = () => {
      // Drop the memo so a retry is possible — a failed load is usually a
      // network blip or, in production, a domain that is not yet allowlisted
      // with the provider.
      loaders.delete(src);
      tag.remove();
      reject(new Error(`Failed to load ${src}`));
    };
    document.head.appendChild(tag);
  });

  loaders.set(src, promise);
  return promise;
};

/**
 * @param src        Script URL, or null to stay idle. Null is supported so the
 *                   hook can be called unconditionally before the session that
 *                   supplies the URL has been fetched.
 * @param globalKey  The property the script assigns on `window`.
 */
export function useExternalScript(
  src: string | null,
  globalKey: string,
): ScriptState {
  // Only the outcome of a load is stored; "idle" and "loading" are derived, so
  // the effect never writes state synchronously just to describe where it
  // already is.
  //
  // The result is tagged with the `src` it belongs to. Without that, switching
  // URLs would report the previous script's "ready" while the new one was still
  // in flight — and the caller would call into a global that is not there yet.
  const [result, setResult] = useState<{
    src: string;
    outcome: "ready" | "error";
  } | null>(null);

  useEffect(() => {
    if (!src) return;

    let active = true;

    loadScript(src, globalKey)
      .then(() => {
        if (active) setResult({ src, outcome: "ready" });
      })
      .catch(() => {
        if (active) setResult({ src, outcome: "error" });
      });

    return () => {
      // The load itself is shared and keeps going; this only stops a resolved
      // promise from writing to a component that has moved on.
      active = false;
    };
  }, [src, globalKey]);

  if (!src) return "idle";
  return result?.src === src ? result.outcome : "loading";
}
