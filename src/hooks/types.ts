/**
 * An axios rejection from this API, narrowed to the two fields the error
 * middleware always sends.
 *
 * `details` is `unknown` on purpose: it carries whatever the failing route had
 * to say — zod issues on a 400, the list of what blocks a delete on a 409 — and
 * the handler that cares is the one that knows the shape. Typing it here would
 * mean this file naming every route's payload.
 */
export type APIError = {
  response?: { data?: { message?: string; details?: unknown } };
};
