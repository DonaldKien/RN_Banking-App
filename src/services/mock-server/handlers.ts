/**
 * Route handlers for the mock banking backend. Each handler receives a parsed
 * request and returns the JSON body for a 2xx response, or throws an
 * `ApiError`, which the router turns into an error response with the matching
 * HTTP status. The data comes from the in-memory mock database.
 */
import { randomUUID } from "expo-crypto";

import { isValidAccountNumber, normaliseMalaysianMobile } from "@/lib/identifiers";
import { formatMoney } from "@/lib/money";
import { API_ENDPOINTS, type ApiEndpoint } from "@/services/api/endpoints";
import { ApiError } from "@/services/api/errors";
import { TRANSFER_LIMITS } from "@/services/api/limits";
import type {
  AccountLookupRequest,
  AccountLookupResult,
  MockScenario,
  Page,
  Recipient,
  Transaction,
  TransactionFilter,
  TransferAuthorization,
  TransferReceipt,
  TransferRequest,
} from "@/services/api/types";

import { DEMO_PIN, MAX_PIN_ATTEMPTS, db, generateReference, resetDb } from "./db";

export interface MockRequest {
  method: string;
  path: string;
  /** Path parameters, e.g. `{ id }` for `API_ENDPOINTS.transactionDetail`. */
  params: Record<string, string>;
  query: Record<string, string>;
  /** Lower-cased header names. */
  headers: Record<string, string>;
  body: unknown;
}

export interface MockRoute {
  method: "GET" | "POST";
  /** An entry from `API_ENDPOINTS`; `:name` segments become `params`. */
  pattern: ApiEndpoint;
  /** Simulated server latency range in milliseconds. */
  latency: [min: number, max: number];
  handler: (request: MockRequest) => unknown;
}

// ---------------------------------------------------------------------------
// Query parameter helpers
// ---------------------------------------------------------------------------

const MAX_PAGE_SIZE = 100;

/** Reads a `limit` query parameter, falling back to the default for missing or invalid values. */
const readLimit = (raw: string | undefined, fallback: number): number => {
  const limit = Number(raw);
  if (!Number.isInteger(limit) || limit < 1) return fallback;
  return Math.min(limit, MAX_PAGE_SIZE);
};

// ---------------------------------------------------------------------------
// Account & recipients
// ---------------------------------------------------------------------------

const getAccount = () => db.state.account;

const getSavedRecipients = () => db.state.recipients;

/** Distinct recipients of the most recent outgoing transfers, newest first. */
const getRecentRecipients = ({ query }: MockRequest): Recipient[] => {
  const limit = readLimit(query.limit, 10);
  const seen = new Set<string>();
  const recent: Recipient[] = [];
  for (const tx of db.state.transactions) {
    if (tx.direction !== "debit") continue;
    const key = `${tx.counterparty.type}:${tx.counterparty.accountId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    recent.push(tx.counterparty);
    if (recent.length >= limit) break;
  }
  return recent;
};

/** Name enquiry: resolves the registered holder name of an account or DuitNow ID. */
const lookupAccount = ({ body }: MockRequest): AccountLookupResult => {
  const request = body as Partial<AccountLookupRequest> | null;
  const raw = request?.accountId ?? "";
  const accountId =
    request?.type === "DUITNOW_MOBILE"
      ? normaliseMalaysianMobile(raw)
      : isValidAccountNumber(raw)
        ? raw
        : null;
  if (!accountId) {
    throw new ApiError("INVALID_RECIPIENT", "The account details are not in a valid format.");
  }
  if (accountId === db.state.account.accountNumber) {
    throw new ApiError("INVALID_RECIPIENT", "You can't transfer to your own account.");
  }
  // Convention for demoing the "not found" state: identifiers ending in 0000.
  if (accountId.endsWith("0000")) {
    throw new ApiError("ACCOUNT_NOT_FOUND", "No account matches these details.");
  }

  const known = db.state.recipients.find((r) => r.accountId === accountId);
  if (known) return { name: known.name };

  // Unknown account: derive a stable, realistic name from the number.
  const pool = db.state.recipients;
  const hash = [...accountId].reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const [first] = pool[hash % pool.length].name.split(" ");
  const last = pool[(hash >>> 8) % pool.length].name.split(" ").slice(-1)[0];
  return { name: `${first} ${last}` };
};

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

const getTransactions = ({ query }: MockRequest): Page<Transaction> => {
  const cursor = query.cursor ?? null;
  const limit = readLimit(query.limit, 30);
  const filter = (query.filter ?? "all") as TransactionFilter;

  const source =
    filter === "all" ? db.state.transactions : db.state.transactions.filter((t) => t.direction === filter);
  // Keyset pagination: the cursor is the id of the last item already received,
  // so newly inserted transactions never shift or duplicate later pages.
  let start = 0;
  if (cursor) {
    const cursorIndex = source.findIndex((t) => t.id === cursor);
    // An unknown cursor must not silently restart from the first page: the
    // client would append page 1 again and show duplicate rows.
    if (cursorIndex === -1) throw new ApiError("BAD_REQUEST", "Invalid pagination cursor.");
    start = cursorIndex + 1;
  }
  const items = source.slice(start, start + limit);
  const nextCursor = start + limit < source.length ? (items[items.length - 1]?.id ?? null) : null;
  return { items, nextCursor };
};

const getTransaction = ({ params }: MockRequest): Transaction => {
  const tx = db.state.transactions.find((t) => t.id === params.id);
  if (!tx) throw new ApiError("NOT_FOUND", "Transaction not found.");
  return tx;
};

// ---------------------------------------------------------------------------
// Authorisation
// ---------------------------------------------------------------------------

/** Verifies the in-app transaction PIN and returns a single-use authorisation token. */
const verifyPin = ({ body }: MockRequest): { token: string } => {
  const pin = (body as { pin?: unknown } | null)?.pin;
  const state = db.state;

  if (state.failedPinAttempts >= MAX_PIN_ATTEMPTS) {
    throw new ApiError("PIN_LOCKED", "Your PIN is locked after too many attempts.");
  }
  if (pin !== DEMO_PIN) {
    state.failedPinAttempts += 1;
    const attemptsRemaining = MAX_PIN_ATTEMPTS - state.failedPinAttempts;
    if (attemptsRemaining <= 0) {
      throw new ApiError("PIN_LOCKED", "Your PIN is locked after too many attempts.");
    }
    throw new ApiError("INVALID_PIN", "Incorrect PIN.", { attemptsRemaining });
  }

  state.failedPinAttempts = 0;
  const token = randomUUID();
  state.pinTokens.add(token);
  return { token };
};

// ---------------------------------------------------------------------------
// Transfers
// ---------------------------------------------------------------------------

const assertAuthorised = (auth: TransferAuthorization | undefined): void => {
  if (auth?.method === "pin") {
    // PIN tokens are single-use: consuming it prevents replaying an approval.
    if (!db.state.pinTokens.delete(auth.token)) {
      throw new ApiError("AUTH_REQUIRED", "Your approval has expired. Please authenticate again.");
    }
    return;
  }
  if (!auth?.assertion) {
    throw new ApiError("AUTH_REQUIRED", "This transfer has not been approved.");
  }
};

/**
 * POST /v1/transfers. The `Idempotency-Key` header makes retries safe: a
 * replayed key returns the original receipt instead of moving money again.
 */
const submitTransfer = ({ headers, body }: MockRequest): TransferReceipt => {
  const idempotencyKey = headers["idempotency-key"];
  if (!idempotencyKey) throw new ApiError("BAD_REQUEST", "The Idempotency-Key header is required.");

  const previous = db.state.idempotency.get(idempotencyKey);
  if (previous) return previous;

  const scenario = (headers["x-mock-scenario"] ?? "none") as MockScenario;
  if (scenario === "server_error") {
    throw new ApiError("SERVER_ERROR", "The transfer service is temporarily unavailable.");
  }

  const request = (body ?? {}) as Partial<Omit<TransferRequest, "idempotencyKey">>;
  assertAuthorised(request.authorization);

  const { account } = db.state;
  const { amount, recipient } = request;

  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < TRANSFER_LIMITS.minAmount) {
    throw new ApiError("INVALID_AMOUNT", "Enter a valid amount.");
  }
  if (!recipient?.accountId) {
    throw new ApiError("INVALID_RECIPIENT", "Choose a recipient.");
  }
  if (amount > TRANSFER_LIMITS.maxAmount) {
    throw new ApiError("LIMIT_EXCEEDED", `The maximum per transfer is ${formatMoney(TRANSFER_LIMITS.maxAmount)}.`);
  }
  if (recipient.accountId === account.accountNumber) {
    throw new ApiError("INVALID_RECIPIENT", "You can't transfer to your own account.");
  }
  if (scenario === "insufficient_funds" || amount > account.balance) {
    throw new ApiError("INSUFFICIENT_FUNDS", "Insufficient funds.", { balance: account.balance });
  }
  if (account.dailyUsed + amount > account.dailyLimit) {
    throw new ApiError("DAILY_LIMIT_EXCEEDED", "Daily transfer limit exceeded.", {
      remaining: account.dailyLimit - account.dailyUsed,
    });
  }

  const transaction: Transaction = {
    id: `txn_${randomUUID()}`,
    reference: generateReference(),
    direction: "debit",
    amount,
    counterparty: recipient,
    note: request.note?.trim() || undefined,
    createdAt: new Date().toISOString(),
    status: "completed",
  };

  account.balance -= amount;
  account.dailyUsed += amount;
  db.state.transactions.unshift(transaction);

  const receipt: TransferReceipt = { transaction, balanceAfter: account.balance };
  db.state.idempotency.set(idempotencyKey, receipt);
  return receipt;
};

// ---------------------------------------------------------------------------
// Demo utilities
// ---------------------------------------------------------------------------

const resetDemoData = () => {
  resetDb();
  return { ok: true };
};

export const routes: readonly MockRoute[] = [
  { method: "GET", pattern: API_ENDPOINTS.account, latency: [300, 800], handler: getAccount },
  { method: "GET", pattern: API_ENDPOINTS.recipients, latency: [300, 800], handler: getSavedRecipients },
  { method: "GET", pattern: API_ENDPOINTS.recentRecipients, latency: [200, 500], handler: getRecentRecipients },
  { method: "POST", pattern: API_ENDPOINTS.recipientLookup, latency: [500, 1000], handler: lookupAccount },
  { method: "GET", pattern: API_ENDPOINTS.transactions, latency: [250, 600], handler: getTransactions },
  { method: "GET", pattern: API_ENDPOINTS.transactionDetail, latency: [150, 400], handler: getTransaction },
  { method: "POST", pattern: API_ENDPOINTS.verifyPin, latency: [400, 800], handler: verifyPin },
  { method: "POST", pattern: API_ENDPOINTS.transfers, latency: [1200, 1800], handler: submitTransfer },
  { method: "POST", pattern: API_ENDPOINTS.demoReset, latency: [200, 400], handler: resetDemoData },
];
