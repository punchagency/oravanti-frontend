import axios from "axios";

/**
 * The un-intercepted axios instance, for flows authenticated by a link token
 * rather than a session.
 *
 * ─── Why there are two ──────────────────────────────────────────────────────
 *
 * `@/api/index.ts` exports `API`, which carries a response interceptor: on a
 * 401 it calls `/auth/refresh-session`, queues concurrent failures behind that
 * one refresh, and broadcasts the result to other tabs. That is right for
 * every call made by a signed-in staff member or client.
 *
 * It is wrong for the flows below. A client following an emailed link — to
 * sign a fee agreement, book a consultation, upload a requested document, pay
 * an invoice, or fill in a questionnaire — has no session at all. Their
 * authority is the token in the URL. A 401 there means *the link is bad or
 * expired*, and the only correct response is to tell them so. Sending it
 * through `API` instead would fire a refresh against a session that does not
 * exist, fail, broadcast `AUTH_EXPIRED`, and clear the auth state of any
 * signed-in tab the person happens to have open — logging a staff member out
 * because a client opened a stale link.
 *
 * So the split is deliberate, and this file existing is not an oversight.
 *
 * ─── Which modules use it ───────────────────────────────────────────────────
 *
 *   api/agreement-signing.ts     api/document-requests.ts
 *   api/consultation-booking.ts  api/invoice-payment.ts
 *   api/questionnaires.ts        (token-based calls only)
 *
 * `questionnaires.ts` is the one that uses both, and the division inside it is
 * the rule for this whole seam: staff-facing endpoints go through `API`,
 * `/questionnaires/client/:token` endpoints come here. If you add a call to
 * this client, it must be one where the URL token is the only credential.
 *
 * `withCredentials` is still set: some of these endpoints are reachable both
 * by an anonymous link holder and by a signed-in user, and the cookie is
 * simply ignored when there isn't one.
 */
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  withCredentials: true,
});
