import type { Transaction } from "@/services/api/types";

import { groupTransactionsByDay } from "../group-by-day";

const tx = (id: string, createdAt: Date): Transaction => {
  return {
    id,
    reference: id,
    direction: "debit",
    amount: 100,
    counterparty: { id: "r", name: "Aisyah", type: "BANK_ACCOUNT", accountId: "1234567890", bankName: "Maybank" },
    createdAt: createdAt.toISOString(),
    status: "completed",
  };
};

describe("groupTransactionsByDay", () => {
  it("inserts a sticky header before each day", () => {
    const now = new Date(2026, 9, 10, 15, 0);
    const transactions = [
      tx("a", new Date(2026, 9, 10, 12, 0)),
      tx("b", new Date(2026, 9, 10, 9, 0)),
      tx("c", new Date(2026, 9, 9, 20, 0)),
      tx("d", new Date(2026, 9, 1, 8, 0)),
    ];

    const { rows, stickyHeaderIndices } = groupTransactionsByDay(transactions, now);

    expect(rows.map((r) => (r.type === "header" ? r.label : r.key))).toEqual([
      "Today",
      "a",
      "b",
      "Yesterday",
      "c",
      "1 Oct 2026",
      "d",
    ]);
    expect(stickyHeaderIndices).toEqual([0, 3, 5]);
  });

  it("handles an empty list", () => {
    expect(groupTransactionsByDay([])).toEqual({ rows: [], stickyHeaderIndices: [] });
  });
});
