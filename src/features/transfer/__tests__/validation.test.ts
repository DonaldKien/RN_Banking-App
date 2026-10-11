import { ringgit } from "@/lib/money";
import type { Recipient } from "@/services/api/types";

import { hasErrors, validateAmount, validateNote, validateTransfer } from "../validation";

const recipient: Recipient = {
  id: "r1",
  name: "Aisyah Lim",
  type: "BANK_ACCOUNT",
  accountId: "1234567890",
  bankCode: "MBB",
  bankName: "Maybank",
};

describe("validateAmount", () => {
  it("requires a positive amount", () => {
    expect(validateAmount(null)).toMatch(/enter an amount/i);
    expect(validateAmount(0)).toMatch(/greater than/i);
  });

  it("rejects amounts above the balance and shows the balance", () => {
    expect(validateAmount(ringgit(100.01), { balance: ringgit(100) })).toBe(
      "Insufficient balance. You have RM 100.00 available.",
    );
    expect(validateAmount(ringgit(100), { balance: ringgit(100) })).toBeUndefined();
  });

  it("enforces the per-transfer and daily limits", () => {
    expect(validateAmount(ringgit(50_000.01))).toMatch(/maximum per transfer/i);
    expect(validateAmount(ringgit(600), { balance: ringgit(10_000), dailyRemaining: ringgit(500) })).toMatch(
      /daily limit of RM 500.00/,
    );
  });
});

describe("validateNote", () => {
  it("allows empty and plain notes", () => {
    expect(validateNote("")).toBeUndefined();
    expect(validateNote("Dinner @ Jalan Alor, 12/10 - thanks!")).toBeUndefined();
  });

  it("rejects overly long notes and unsupported characters", () => {
    expect(validateNote("x".repeat(141))).toMatch(/under 140/);
    expect(validateNote("<script>")).toMatch(/letters, numbers/);
  });
});

describe("validateTransfer", () => {
  it("returns no errors for a valid draft", () => {
    const errors = validateTransfer({ recipient, amount: ringgit(10), note: "", balance: ringgit(50) });
    expect(hasErrors(errors)).toBe(false);
  });

  it("reports each invalid field", () => {
    const errors = validateTransfer({ recipient: null, amount: null, note: "<>" });
    expect(Object.keys(errors).sort()).toEqual(["amount", "note", "recipient"]);
  });

  it("prevents transfers to the user's own account", () => {
    const errors = validateTransfer({
      recipient,
      amount: ringgit(1),
      note: "",
      ownAccountNumber: recipient.accountId,
    });
    expect(errors.recipient).toMatch(/own account/);
  });
});
