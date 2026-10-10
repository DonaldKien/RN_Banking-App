import type { Recipient } from "@/services/api/types";

import { buildRecipientRows, matchesRecipient } from "../recipient-rows";

const recipient = (id: string, name: string, accountId: string, isFavourite = false): Recipient => {
  return { id, name, type: "BANK_ACCOUNT", accountId, bankName: "Maybank", isFavourite };
};

const saved = [
  recipient("1", "Aisyah Lim", "1111222233"),
  recipient("2", "Ben Tan", "4444555566", true),
  recipient("3", "Chloe Wong", "7777888899"),
];
const recent = [saved[2], recipient("x", "Daniel Ng", "9999000011")];

describe("matchesRecipient", () => {
  it("matches by name, case-insensitively", () => {
    expect(matchesRecipient(saved[0], "aisyah")).toBe(true);
  });

  it("matches account numbers only after three digits", () => {
    expect(matchesRecipient(saved[0], "11")).toBe(false);
    expect(matchesRecipient(saved[0], "2223")).toBe(true);
  });
});

describe("buildRecipientRows", () => {
  it("builds Recent, Favourites and All sections with sticky headers", () => {
    const { rows, stickyHeaderIndices } = buildRecipientRows(saved, recent, "");
    const headers = rows.filter((r) => r.type === "header").map((r) => (r.type === "header" ? r.label : ""));

    expect(headers).toEqual(["Recent", "Favourites", "All recipients"]);
    expect(stickyHeaderIndices).toEqual([0, 3, 5]);
    expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length);
  });

  it("collapses into de-duplicated results when searching", () => {
    const { rows } = buildRecipientRows(saved, recent, "n");
    const names = rows.flatMap((r) => (r.type === "recipient" ? [r.recipient.name] : []));
    // Chloe is both recent and saved but appears once; unsaved recent recipients are included.
    expect(names).toEqual(["Chloe Wong", "Daniel Ng", "Ben Tan"]);
  });
});
