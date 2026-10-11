import { ringgit } from "@/lib/money";
import { DEMO_PIN, resetDb } from "@/services/mock-server/db";

import { getAccount, getTransactions, submitTransfer, verifyPin } from "../bank-api";
import { isApiError } from "../errors";
import type { Recipient, TransferRequest } from "../types";

let mockUuid = 0;
jest.mock("expo-crypto", () => ({ randomUUID: () => `uuid-${++mockUuid}` }));

const recipient: Recipient = {
  id: "r1",
  name: "Aisyah Lim",
  type: "BANK_ACCOUNT",
  accountId: "1234567890",
  bankCode: "MBB",
  bankName: "Maybank",
};

const request = (overrides: Partial<TransferRequest> = {}): TransferRequest => {
  return {
    idempotencyKey: `key-${Math.random()}`,
    recipient,
    amount: ringgit(10),
    authorization: { method: "biometric", assertion: "biometric:test" },
    ...overrides,
  };
};

/** Runs an API call to completion under fake timers (the mock API simulates latency). */
const settle = async <T>(promise: Promise<T>): Promise<T> => {
  const result = promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  await jest.advanceTimersByTimeAsync(10_000);
  const outcome = await result;
  if (!outcome.ok) throw outcome.error;
  return outcome.value;
};

beforeEach(() => {
  jest.useFakeTimers();
  resetDb();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("submitTransfer", () => {
  it("debits the balance and records the transaction", async () => {
    const before = await settle(getAccount());
    const receipt = await settle(submitTransfer(request({ amount: ringgit(25) })));

    expect(receipt.balanceAfter).toBe(before.balance - ringgit(25));
    const page = await settle(getTransactions({ limit: 1 }));
    expect(page.items[0].id).toBe(receipt.transaction.id);
  });

  it("is idempotent: replaying a key never debits twice", async () => {
    const before = await settle(getAccount());
    const req = request();
    const first = await settle(submitTransfer(req));
    const second = await settle(submitTransfer(req));

    expect(second.transaction.id).toBe(first.transaction.id);
    expect((await settle(getAccount())).balance).toBe(before.balance - req.amount);
  });

  it("recovers the receipt after a timeout where the server already processed the transfer", async () => {
    const before = await settle(getAccount());
    const req = request();

    await expect(settle(submitTransfer(req, { scenario: "timeout" }))).rejects.toMatchObject({ code: "TIMEOUT" });
    const retried = await settle(submitTransfer(req));

    expect(retried.balanceAfter).toBe(before.balance - req.amount);
    expect((await settle(getAccount())).balance).toBe(before.balance - req.amount);
  });

  it("does not move money on a network error", async () => {
    const before = await settle(getAccount());
    await expect(settle(submitTransfer(request(), { scenario: "network_error" }))).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
    expect((await settle(getAccount())).balance).toBe(before.balance);
  });

  it("rejects transfers above the balance", async () => {
    const { balance } = await settle(getAccount());
    const error = await settle(submitTransfer(request({ amount: balance + 1 }))).catch((e: unknown) => e);
    expect(isApiError(error) && error.code).toBe("INSUFFICIENT_FUNDS");
  });

  it("requires a valid, single-use PIN token", async () => {
    const { token } = await settle(verifyPin(DEMO_PIN));
    await settle(submitTransfer(request({ authorization: { method: "pin", token } })));

    await expect(
      settle(submitTransfer(request({ authorization: { method: "pin", token } }))),
    ).rejects.toMatchObject({ code: "AUTH_REQUIRED" });
  });
});

describe("verifyPin", () => {
  it("counts down attempts and then locks", async () => {
    await expect(settle(verifyPin("000000"))).rejects.toMatchObject({
      code: "INVALID_PIN",
      details: { attemptsRemaining: 4 },
    });
    for (let i = 0; i < 3; i++) await settle(verifyPin("000000")).catch(() => {});
    await expect(settle(verifyPin("000000"))).rejects.toMatchObject({ code: "PIN_LOCKED" });
    await expect(settle(verifyPin(DEMO_PIN))).rejects.toMatchObject({ code: "PIN_LOCKED" });
  });
});

describe("getTransactions", () => {
  it("paginates with a stable cursor even when new transactions arrive", async () => {
    const first = await settle(getTransactions({ limit: 10 }));
    await settle(submitTransfer(request()));
    const second = await settle(getTransactions({ cursor: first.nextCursor, limit: 10 }));

    const ids = new Set(first.items.map((t) => t.id));
    expect(second.items.some((t) => ids.has(t.id))).toBe(false);
  });
});
