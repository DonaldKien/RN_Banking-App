import { API_ENDPOINTS, buildPath } from "@/services/api/endpoints";

import { resetDb } from "../db";
import { mockFetch } from "../mock-fetch";

let mockUuid = 0;
jest.mock("expo-crypto", () => ({ randomUUID: () => `uuid-${++mockUuid}` }));

const BASE = "https://api.rytbank.example";

/** Calls the mock server like a real fetch, fast-forwarding its simulated latency. */
const request = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const pending = mockFetch(`${BASE}${path}`, init);
  await jest.advanceTimersByTimeAsync(5_000);
  return pending;
};

const transfer = (headers: Record<string, string>, body: unknown = {}) =>
  request(API_ENDPOINTS.transfers, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  jest.useFakeTimers();
  resetDb();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("mockFetch", () => {
  it("serves the mock data as a JSON response", async () => {
    const response = await request(API_ENDPOINTS.account);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(await response.json()).toMatchObject({ holderName: "Alex Tan", accountNumber: "8801234567" });
  });

  it("supports path parameters and query strings", async () => {
    const list = await (await request(`${API_ENDPOINTS.transactions}?limit=2&filter=debit`)).json();
    expect(list.items).toHaveLength(2);
    expect(list.items.every((t: { direction: string }) => t.direction === "debit")).toBe(true);

    const detail = await request(buildPath(API_ENDPOINTS.transactionDetail, { id: list.items[0].id }));
    expect((await detail.json()).id).toBe(list.items[0].id);
  });

  it("returns 404 with an error body for unknown routes and records", async () => {
    // Deliberately not an API_ENDPOINTS entry.
    const unknownRoute = await request("/v1/nope");
    expect(unknownRoute.status).toBe(404);
    expect(await unknownRoute.json()).toMatchObject({ error: { code: "NOT_FOUND" } });

    const unknownRecord = await request(buildPath(API_ENDPOINTS.transactionDetail, { id: "does-not-exist" }));
    expect(unknownRecord.status).toBe(404);
  });

  it("maps business errors to HTTP status codes", async () => {
    const missingKey = await transfer({});
    expect(missingKey.status).toBe(400);

    const insufficient = await transfer(
      { "Idempotency-Key": "k1", "X-Mock-Scenario": "insufficient_funds" },
      {
        amount: 100,
        recipient: { accountId: "1234567890" },
        authorization: { method: "biometric", assertion: "x" },
      },
    );
    expect(insufficient.status).toBe(422);
    expect(await insufficient.json()).toMatchObject({ error: { code: "INSUFFICIENT_FUNDS" } });

    const unauthorised = await transfer({ "Idempotency-Key": "k2" }, { amount: 100, recipient: { accountId: "1" } });
    expect(unauthorised.status).toBe(401);
  });

  it("answers malformed JSON with 400 instead of failing like a network error", async () => {
    const response = await request(API_ENDPOINTS.recipientLookup, { method: "POST", body: "{not json" });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: "BAD_REQUEST" } });
  });

  it("rejects an unknown pagination cursor instead of restarting from page 1", async () => {
    const response = await request(`${API_ENDPOINTS.transactions}?cursor=does-not-exist`);
    expect(response.status).toBe(400);
  });

  it("falls back to the default page size for an invalid limit", async () => {
    const page = await (await request(`${API_ENDPOINTS.transactions}?limit=abc`)).json();
    expect(page.items).toHaveLength(30);

    const capped = await (await request(`${API_ENDPOINTS.transactions}?limit=100000`)).json();
    expect(capped.items).toHaveLength(100);
  });

  it("rejects like an offline fetch for the network_error scenario", async () => {
    const pending = mockFetch(`${BASE}${API_ENDPOINTS.account}`, { headers: { "X-Mock-Scenario": "network_error" } }).catch(
      (error: unknown) => error,
    );
    await jest.advanceTimersByTimeAsync(5_000);
    expect(await pending).toBeInstanceOf(TypeError);
  });
});
