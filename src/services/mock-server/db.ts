/**
 * In-memory "backend" state for the simulated banking API.
 *
 * Data is generated from a seeded PRNG so every launch shows the same
 * recipients and history, while still being large enough (≈1,500
 * transactions, ≈150 saved recipients) to exercise list virtualisation.
 */
import { ringgit } from "@/lib/money";

import { BANKS, DUITNOW_LABEL, OWN_BANK } from "@/services/api/banks";
import type { Account, Recipient, Transaction, TransferReceipt } from "@/services/api/types";

const FIRST_NAMES = [
  "Aisyah", "Ahmad", "Mei Ling", "Wei Jie", "Priya", "Arjun", "Siti", "Hafiz", "Jia Hui", "Kumar",
  "Nurul", "Faizal", "Chloe", "Daniel", "Farah", "Imran", "Kavitha", "Jason", "Liyana", "Marcus",
  "Nadia", "Raj", "Sarah", "Tan", "Vanessa", "Wan", "Yusuf", "Zara", "Ben", "Grace",
];
const LAST_NAMES = [
  "Abdullah", "Lim", "Tan", "Wong", "Ismail", "Raman", "Lee", "Chong", "Rahman", "Ng",
  "Hassan", "Subramaniam", "Ong", "Yusof", "Goh", "Krishnan", "Teo", "Aziz", "Chan", "Low",
];
const NOTES = [
  "Lunch", "Dinner split", "Rent", "Groceries", "Movie tickets", "Birthday gift", "Utilities",
  "Badminton court", "Parking", "Grab ride", "Concert", "Coffee", "Football", "Car pool",
];
const MERCHANT_CREDITS = ["Salary · Acme Sdn Bhd", "Refund · Shopee", "Cashback · Ryt Rewards"];

export const DEMO_PIN = "123456";
export const MAX_PIN_ATTEMPTS = 5;

/** Deterministic PRNG (mulberry32) so seed data is identical across launches. */
const createRandom = (seed: number) => {
  let state = seed;
  const next = () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
  };
};

const randomDigits = (random: ReturnType<typeof createRandom>, length: number): string => {
  let out = String(random.int(1, 9));
  while (out.length < length) out += String(random.int(0, 9));
  return out;
};

export const generateReference = (): string => {
  const stamp = Date.now().toString(36).toUpperCase();
  const suffix = Math.floor(Math.random() * 36 ** 4).toString(36).toUpperCase().padStart(4, "0");
  return `RYT${stamp}${suffix}`;
};

export interface MockDbState {
  account: Account;
  recipients: Recipient[];
  /** Newest first. */
  transactions: Transaction[];
  idempotency: Map<string, TransferReceipt>;
  pinTokens: Set<string>;
  failedPinAttempts: number;
}

const createRecipients = (random: ReturnType<typeof createRandom>): Recipient[] => {
  const seen = new Set<string>();
  const recipients: Recipient[] = [];

  while (recipients.length < 150) {
    const name = `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`;
    if (seen.has(name)) continue;
    seen.add(name);

    const id = `rcp_${recipients.length + 1}`;
    if (random.next() < 0.3) {
      recipients.push({
        id,
        name,
        type: "DUITNOW_MOBILE",
        accountId: `601${randomDigits(random, 8)}`,
        bankName: DUITNOW_LABEL,
        isFavourite: random.next() < 0.08,
      });
    } else {
      const bank = random.pick(BANKS);
      recipients.push({
        id,
        name,
        type: "BANK_ACCOUNT",
        accountId: randomDigits(random, random.int(10, 14)),
        bankCode: bank.code,
        bankName: bank.shortName,
        isFavourite: random.next() < 0.08,
      });
    }
  }
  return recipients.sort((a, b) => a.name.localeCompare(b.name));
};

const createTransactions = (
  random: ReturnType<typeof createRandom>,
  recipients: Recipient[],
  now: number,
): Transaction[] => {
  const transactions: Transaction[] = [];
  // A handful of frequent recipients makes "recent" / "quick send" realistic.
  const regulars = recipients.slice(0, 12);
  let cursor = now - 20 * 60 * 1000;

  for (let i = 0; i < 1500; i++) {
    cursor -= random.int(20, 240) * 60 * 1000;
    const isCredit = random.next() < 0.22;
    let counterparty: Recipient;
    if (!isCredit) {
      counterparty = random.pick(random.next() < 0.6 ? regulars : recipients);
    } else if (random.next() < 0.5) {
      counterparty = random.pick(recipients);
    } else {
      counterparty = {
        id: `ext_${i}`,
        name: random.pick(MERCHANT_CREDITS),
        type: "BANK_ACCOUNT",
        accountId: randomDigits(random, 12),
        bankName: random.pick(BANKS).shortName,
      };
    }

    transactions.push({
      id: `txn_seed_${i}`,
      reference: `RYT${(now - i * 7919).toString(36).toUpperCase()}`,
      direction: isCredit ? "credit" : "debit",
      amount: random.int(5, isCredit ? 2500 : 800) * 100 + random.pick([0, 0, 50, 90, 25]),
      counterparty,
      note: random.next() < 0.7 ? random.pick(NOTES) : undefined,
      createdAt: new Date(cursor).toISOString(),
      status: "completed",
    });
  }
  return transactions;
};

export const createInitialState = (now: number = Date.now()): MockDbState => {
  const random = createRandom(20261010);
  const recipients = createRecipients(random);
  const transactions = createTransactions(random, recipients, now);

  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const dailyUsed = transactions
    .filter((t) => t.direction === "debit" && Date.parse(t.createdAt) >= startOfToday)
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    account: {
      id: "acc_primary",
      holderName: "Alex Tan",
      productName: "Ryt Savings",
      accountNumber: "8801234567",
      balance: ringgit(12480.5),
      dailyLimit: ringgit(30000),
      dailyUsed,
    },
    recipients,
    transactions,
    idempotency: new Map(),
    pinTokens: new Set(),
    failedPinAttempts: 0,
  };
};

/** The live mock database. Mutated only by the mock server handlers. */
export const db: { state: MockDbState } = { state: createInitialState() };

export const resetDb = (): void => {
  db.state = createInitialState();
};

export const OWN_BANK_CODE = OWN_BANK.code;
