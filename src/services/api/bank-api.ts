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

// Shorter deadline so a stalled transfer surfaces quickly as a (safe-to-retry) timeout.
const TRANSFER_TIMEOUT_MS = 5_000;

const http = createHttpClient({
  baseUrl: API_BASE_URL,
  fetch: USE_MOCK_API ? mockFetch : (input, init) => fetch(input, init),
});

export const getAccount = () => http.get<Account>(API_ENDPOINTS.account);

export const getSavedRecipients = () => http.get<Recipient[]>(API_ENDPOINTS.recipients);

export const getRecentRecipients = (limit = 10) => http.get<Recipient[]>(API_ENDPOINTS.recentRecipients, { query: { limit } });

export const lookupAccount = (request: AccountLookupRequest) =>
  http.post<AccountLookupResult>(API_ENDPOINTS.recipientLookup, { body: request });

export const getTransactions = ({
  cursor = null,
  limit = 30,
  filter = "all",
}: {
  cursor?: string | null;
  limit?: number;
  filter?: TransactionFilter;
}) => http.get<Page<Transaction>>(API_ENDPOINTS.transactions, { query: { cursor, limit, filter } });

export const getTransaction = (id: string) => http.get<Transaction>(buildPath(API_ENDPOINTS.transactionDetail, { id }));

export const verifyPin = (pin: string) => http.post<{ token: string }>(API_ENDPOINTS.verifyPin, { body: { pin } });

/** `scenario` sets `X-Mock-Scenario`, read only by the mock server (demo controls). */
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

// Mock-only.
export const resetDemoData = () => http.post<{ ok: boolean }>(API_ENDPOINTS.demoReset);
