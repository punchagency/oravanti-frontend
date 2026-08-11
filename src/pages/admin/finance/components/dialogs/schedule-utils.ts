import type { InstalmentInput } from "@/api/finance";

/**
 * Payment-schedule arithmetic, kept out of `schedule-editor.tsx` so that file
 * exports only components — a module mixing the two disables Fast Refresh.
 * Same reason `dialog-styles.ts` exists.
 */

export type ScheduleDraft = { dueDate: string; amount: string };

/** Date arithmetic in UTC on the string, so no timezone can shift a due date. */
const addDays = (ymd: string, days: number): string => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d! + days)).toISOString().slice(0, 10);
};

/** Add months, clamping to the end of the target month: 31 Jan + 1m = 28 Feb. */
export const addMonths = (ymd: string, months: number): string => {
  const [y, m, d] = ymd.split("-").map(Number);
  const target = new Date(Date.UTC(y!, m! - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return new Date(
    Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      Math.min(d!, lastDay),
    ),
  )
    .toISOString()
    .slice(0, 10);
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Mirrors `generateSchedule` on the server, including where the remainder goes.
 *
 * The remainder lands on the LAST row so the instalments sum to the total
 * exactly. Dividing without placing it gives 333.33 x 3 = 999.99, which the
 * server rejects — the bug the fee-agreement wizard has today.
 */
export const buildSchedule = (
  total: number,
  count: number,
  startDate: string,
  frequency: string,
): ScheduleDraft[] => {
  const each = round2(total / count);
  const rows: ScheduleDraft[] = [];
  let allocated = 0;

  for (let i = 0; i < count; i += 1) {
    const amount = i === count - 1 ? round2(total - allocated) : each;
    allocated = round2(allocated + amount);
    const dueDate =
      frequency === "weekly"
        ? addDays(startDate, i * 7)
        : frequency === "fortnightly"
          ? addDays(startDate, i * 14)
          : addMonths(startDate, i);
    rows.push({ dueDate, amount: amount.toFixed(2) });
  }
  return rows;
};

export const scheduleTotal = (rows: ScheduleDraft[]): number =>
  round2(rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0));

/** Within half a cent, the same tolerance the server applies. */
export const isScheduleBalanced = (
  rows: ScheduleDraft[],
  invoiceTotal: number,
): boolean => Math.abs(scheduleTotal(rows) - invoiceTotal) < 0.005;

export const toInstalmentInput = (rows: ScheduleDraft[]): InstalmentInput[] =>
  rows
    .filter((r) => r.dueDate && Number(r.amount) > 0)
    .map((r) => ({ dueDate: r.dueDate, amount: Number(r.amount) }));
