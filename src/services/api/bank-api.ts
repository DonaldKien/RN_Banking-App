/**
 * Banking API calls. Paths come from `endpoints.ts`, and each function is a
 * plain HTTP call through the shared client; nothing here knows whether a real
 * backend or the in-app mock server is answering (see `services/http/config.ts`).
 */
import { API_BASE_URL, USE_MOCK_API } from "@/services/http/config";
import { createHttpClient } from "@/services/http/http-client";
import { mockFetch } from "@/services/mock-server/mock-fetch";

import { API_ENDPOINTS, buildPath } from "./endpoints";
import type {
  Account,
  AccountLookupRequest,
  AccountLookupResult,
  MockScenario,
  Page,
  Recipient,
  Transaction,
  TransactionFilter,
  TransferReceipt,
  TransferRequest,
} from "./types";

/** Transfers get a tighter deadline so a stalled request surfaces quickly as a safe-to-retry timeout. */
const TRANSFER_TIMEOUT_MS = 5_000;

const http = createHttpClient({
  baseUrl: API_BASE_URL,
  fetch: USE_MOCK_API ? mockFetch : (input, init) => fetch(input, init),
});

/** GET — the signed-in user's account and balance. */
export const getAccount = () => http.get<Account>(API_ENDPOINTS.account);

/** GET — saved recipients. */
export const getSavedRecipients = () => http.get<Recipient[]>(API_ENDPOINTS.recipients);

/** GET — distinct recipients of recent transfers, newest first. */
export const getRecentRecipients = (limit = 10) => http.get<Recipient[]>(API_ENDPOINTS.recentRecipients, { query: { limit } });

/** POST — name enquiry for an account number or DuitNow ID. */
export const lookupAccount = (request: AccountLookupRequest) =>
  http.post<AccountLookupResult>(API_ENDPOINTS.recipientLookup, { body: request });

/** GET — keyset-paginated history (`cursor`, `limit`, `filter` query params). */
export const getTransactions = ({
  cursor = null,
  limit = 30,
  filter = "all",
}: {
  cursor?: string | null;
  limit?: number;
  filter?: TransactionFilter;
}) => http.get<Page<Transaction>>(API_ENDPOINTS.transactions, { query: { cursor, limit, filter } });

/** GET — a single transaction. */
export const getTransaction = (id: string) => http.get<Transaction>(buildPath(API_ENDPOINTS.transactionDetail, { id }));

/** POST — verifies the transaction PIN and returns a single-use authorisation token. */
export const verifyPin = (pin: string) => http.post<{ token: string }>(API_ENDPOINTS.verifyPin, { body: { pin } });

/**
 * POST — makes a transfer.
 *
 * The idempotency key travels in the standard `Idempotency-Key` header.
 * `scenario` sets `X-Mock-Scenario`, a test header only the mock server reads,
 * used by the demo controls to force failures.
 */
export const submitTransfer = (
  { idempotencyKey, ...body }: TransferRequest,
  { scenario = "none" }: { scenario?: MockScenario } = {},
) =>
  http.post<TransferReceipt>(API_ENDPOINTS.transfers, {
    body,
    headers: {
      "Idempotency-Key": idempotencyKey,
      ...(scenario !== "none" ? { "X-Mock-Scenario": scenario } : {}),
    },
    timeoutMs: TRANSFER_TIMEOUT_MS,
  });

/** POST — mock-only: restores the seed data. */
export const resetDemoData = () => http.post<{ ok: boolean }>(API_ENDPOINTS.demoReset);
