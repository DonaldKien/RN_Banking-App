import { createHttpClient, type FetchLike } from "../http-client";

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const clientWith = (fetch: FetchLike) => createHttpClient({ baseUrl: "https://api.test", fetch });

describe("createHttpClient", () => {
  it("builds the URL, query string, headers and JSON body", async () => {
    const fetch = jest.fn<Promise<Response>, Parameters<FetchLike>>(async () => jsonResponse(200, { ok: true }));
    const http = clientWith(fetch);

    await http.get("/items", { query: { cursor: null, limit: 30, filter: "a b" } });
    await http.post("/items", { body: { amount: 100 }, headers: { "Idempotency-Key": "k1" } });

    expect(fetch.mock.calls[0][0]).toBe("https://api.test/items?limit=30&filter=a%20b");
    expect(fetch.mock.calls[0][1]).toMatchObject({ method: "GET", body: undefined });

    const [url, init] = fetch.mock.calls[1];
    expect(url).toBe("https://api.test/items");
    expect(init).toMatchObject({
      method: "POST",
      body: JSON.stringify({ amount: 100 }),
      headers: { "Content-Type": "application/json", "Idempotency-Key": "k1" },
    });
  });

  it("returns the parsed JSON body on success", async () => {
    const http = clientWith(async () => jsonResponse(200, { balance: 1250 }));
    await expect(http.get("/items/1")).resolves.toEqual({ balance: 1250 });
  });

  it("maps an error body to a typed ApiError", async () => {
    const http = clientWith(async () =>
      jsonResponse(422, { error: { code: "INSUFFICIENT_FUNDS", message: "Insufficient funds.", details: { balance: 5 } } }),
    );
    await expect(http.post("/items")).rejects.toMatchObject({
      name: "ApiError",
      code: "INSUFFICIENT_FUNDS",
      details: { balance: 5 },
    });
  });

  it("maps a non-JSON 5xx to SERVER_ERROR", async () => {
    const http = clientWith(async () => new Response("<html>Bad gateway</html>", { status: 502 }));
    await expect(http.get("/items")).rejects.toMatchObject({ code: "SERVER_ERROR" });
  });

  it("maps a non-JSON success body to a typed SERVER_ERROR", async () => {
    const http = clientWith(async () => new Response("<html>OK</html>", { status: 200 }));
    await expect(http.get("/items")).rejects.toMatchObject({ name: "ApiError", code: "SERVER_ERROR" });
  });

  it("maps a rejected fetch to NETWORK_ERROR", async () => {
    const http = clientWith(async () => {
      throw new TypeError("Network request failed");
    });
    await expect(http.get("/items")).rejects.toMatchObject({ code: "NETWORK_ERROR" });
  });

  it("aborts after the deadline and reports TIMEOUT", async () => {
    jest.useFakeTimers();
    const http = clientWith(
      (_url, init) =>
        new Promise((_, reject) => {
          init.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );

    const result = http.get("/slow", { timeoutMs: 1000 }).catch((error: unknown) => error);
    await jest.advanceTimersByTimeAsync(1000);

    await expect(result).resolves.toMatchObject({ code: "TIMEOUT" });
    jest.useRealTimers();
  });
});
