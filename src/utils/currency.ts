/**
 * Currency formatting for the finance screens.
 *
 * The backend sends money as numbers already rounded to the 2dp a client is
 * actually billed, so nothing here re-rounds — it only formats.
 *
 * `null` means "withheld", not "zero": trust figures come back null when the
 * caller has no IOLTA access, and a rate that was never configured is null
 * rather than 0. Rendering an em-dash for those is the whole point; a $0.00
 * would be a lie.
 */

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const USD_COMPACT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** "$4,492.50". Withheld/absent values render as an em-dash. */
export const formatCurrency = (
  value: number | null | undefined,
  fallback = "—",
): string => (value == null ? fallback : USD.format(value));

/** "$4,493" — for tight spaces like axis labels and chips. */
export const formatCurrencyCompact = (
  value: number | null | undefined,
  fallback = "—",
): string => (value == null ? fallback : USD_COMPACT.format(value));

/** "2.5h" / "26.5h". Trailing ".0" is kept so a column of hours aligns. */
export const formatHours = (
  value: number | null | undefined,
  fallback = "—",
): string => (value == null ? fallback : `${value.toFixed(1)}h`);

/** "38%" */
export const formatPercent = (
  value: number | null | undefined,
  fallback = "—",
): string => (value == null ? fallback : `${Math.round(value)}%`);

/** Share of a total, guarding the divide-by-zero an empty firm would hit. */
export const percentOf = (part: number, total: number): number =>
  total > 0 ? (part / total) * 100 : 0;
