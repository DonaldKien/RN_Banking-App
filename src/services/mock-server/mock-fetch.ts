/**
 * A drop-in replacement for `fetch` that serves the dummy API endpoints from
 * memory, in the spirit of Mock Service Worker. The HTTP client builds real
 * requests (method, URL, headers, JSON body); this transport answers them with
 * real `Response` objects, so the client code is identical to production.
 *
 * Network conditions are simulated here, at the transport level, driven by
 * the `X-Mock-Scenario` request header:
 * - `network_error`: the request never reaches the server and `fetch` rejects,
 *   as it does when offline.
 * - `timeout`: the server processes the request but never responds, so the
 *   client's deadline aborts it.
 */
import { isApiError, type ApiErrorCode } from "@/services/api/errors";
import type { ErrorBody } from "@/services/http/http-client";

import { routes, type MockRequest, type MockRoute } from "./handlers";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  BAD_REQUEST: 400,
  INVALID_AMOUNT: 400,
  INVALID_RECIPIENT: 400,
  AUTH_REQUIRED: 401,
  INVALID_PIN: 401,
  NOT_FOUND: 404,
  ACCOUNT_NOT_FOUND: 404,
  INSUFFICIENT_FUNDS: 422,
  DAILY_LIMIT_EXCEEDED: 422,
  LIMIT_EXCEEDED: 422,
  PIN_LOCKED: 423,
  SERVER_ERROR: 503,
  TIMEOUT: 504,
  NETWORK_ERROR: 503,
};

const abortError = (): Error => {
  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  return error;
};

/** Resolves after `ms`, or rejects early if the request is aborted. */
const wait = (ms: number, signal?: AbortSignal | null): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(abortError());
    });
  });
};

/** Never resolves; rejects when the client aborts the request. */
const waitForAbort = (signal?: AbortSignal | null): Promise<never> => {
  return new Promise((_, reject) => {
    if (signal?.aborted) return reject(abortError());
    signal?.addEventListener("abort", () => reject(abortError()));
  });
};

const json = (status: number, body: unknown): Response => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
};

const errorResponse = (code: ApiErrorCode, message: string, details: Record<string, unknown> = {}) => {
  const body: ErrorBody = { error: { code, message, details } };
  return json(STATUS_BY_CODE[code], body);
};

/** Parses `a=1&b=x%20y` by hand: React Native's URL polyfill lacks searchParams. */
const parseQuery = (queryString: string): Record<string, string> => {
  const query: Record<string, string> = {};
  for (const pair of queryString.split("&")) {
    if (!pair) continue;
    const [key, value = ""] = pair.split("=");
    query[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, " "));
  }
  return query;
};

/** Header names are case-insensitive; the `Headers` class lower-cases them for us. */
const normaliseHeaders = (headers: HeadersInit | undefined): Record<string, string> => {
  const result: Record<string, string> = {};
  new Headers(headers).forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

const matchRoute = (method: string, path: string): { route: MockRoute; params: Record<string, string> } | null => {
  const segments = path.split("/").filter(Boolean);
  for (const route of routes) {
    if (route.method !== method) continue;
    const patternSegments = route.pattern.split("/").filter(Boolean);
    if (patternSegments.length !== segments.length) continue;

    const params: Record<string, string> = {};
    const matches = patternSegments.every((part, i) => {
      if (part.startsWith(":")) {
        params[part.slice(1)] = decodeURIComponent(segments[i]);
        return true;
      }
      return part === segments[i];
    });
    if (matches) return { route, params };
  }
  return null;
};

export const mockFetch = async (input: string, init: RequestInit = {}): Promise<Response> => {
  const method = (init.method ?? "GET").toUpperCase();
  // Strip the scheme and host: every request to the dummy API host lands here.
  const [path, queryString = ""] = input.replace(/^https?:\/\/[^/]+/, "").split("?");
  const headers = normaliseHeaders(init.headers);
  const scenario = headers["x-mock-scenario"];

  const match = matchRoute(method, path);
  if (!match) {
    await wait(100, init.signal);
    return errorResponse("NOT_FOUND", `No mock route for ${method} ${path}.`);
  }

  const [min, max] = match.route.latency;
  await wait(min + Math.random() * (max - min), init.signal);

  if (scenario === "network_error") {
    // Same failure React Native's fetch reports when the device is offline.
    throw new TypeError("Network request failed");
  }

  let body: unknown = null;
  if (typeof init.body === "string" && init.body) {
    try {
      body = JSON.parse(init.body);
    } catch {
      // A real server answers malformed JSON with 400, not a dropped connection.
      return errorResponse("BAD_REQUEST", "The request body is not valid JSON.");
    }
  }

  const request: MockRequest = {
    method,
    path,
    params: match.params,
    query: parseQuery(queryString),
    headers,
    body,
  };

  let response: Response;
  try {
    response = json(200, await match.route.handler(request));
  } catch (error) {
    response =
      isApiError(error)
        ? errorResponse(error.code, error.message, error.details)
        : errorResponse("SERVER_ERROR", "Internal server error.");
  }

  if (scenario === "timeout") {
    // The server has processed the request, but the response never arrives.
    return waitForAbort(init.signal);
  }
  return response;
};
