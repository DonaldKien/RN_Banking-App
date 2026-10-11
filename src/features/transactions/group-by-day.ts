import { dayKey, formatDayLabel } from "@/lib/format";
import type { Transaction } from "@/services/api/types";

export type HistoryRow =
  | { type: "header"; key: string; label: string }
  | { type: "transaction"; key: string; transaction: Transaction };

// A flat array (not nested sections) is what FlashList virtualises best.
export const groupTransactionsByDay = (
  transactions: readonly Transaction[],
  now: Date = new Date(),
): { rows: HistoryRow[]; stickyHeaderIndices: number[] } => {
  const rows: HistoryRow[] = [];
  const stickyHeaderIndices: number[] = [];
  let currentDay: string | null = null;

  for (const transaction of transactions) {
    const day = dayKey(transaction.createdAt);
    if (day !== currentDay) {
      currentDay = day;
      stickyHeaderIndices.push(rows.length);
      rows.push({ type: "header", key: `header:${day}`, label: formatDayLabel(transaction.createdAt, now) });
    }
    rows.push({ type: "transaction", key: transaction.id, transaction });
  }

  return { rows, stickyHeaderIndices };
};
