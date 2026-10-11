/**
 * A small HTTP client for talking to a JSON API, built on top of `fetch`.
 *
 * What it does for every request:
 *   1. Builds the full URL (base URL + path + query string).
 *   2. Adds JSON headers and turns the body into a JSON string.
 *   3. Starts a timer, and cancels the request if it takes too long.
 *   4. Sends the request.
 *   5. Reads the response, and turns any failure into a typed `ApiError`.
 *
 * How failures are reported:
 *   - The server answered with an error status (4xx/5xx)
 *       → `ApiError` with the code from the server's error body.
 *   - The request took longer than the timeout
 *       → `ApiError` with code `TIMEOUT`.
 *   - The request never reached the server (offline, DNS, TLS, ...)
 *       → `ApiError` with code `NETWORK_ERROR`.
 *
 * The `fetch` function is passed in rather than imported, so the same client
 * can talk to a real backend or to the in-app mock server.
 */
import { ApiError, type ApiErrorCode } from "@/services/api/errors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Anything with the same shape as the global `fetch` function. */
export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

/** Values allowed in a query string. Empty values (`null`, `undefined`, `""`) are left out. */
type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  /** Query string parameters, e.g. `{ limit: 30 }` becomes `?limit=30`. */
  query?: Record<string, QueryValue>;
  /** Request body. It is sent as JSON. */
  body?: unknown;
  /** Extra headers, e.g. `{ "Idempotency-Key": "..." }`. */
  headers?: Record<string, string>;
  /** Cancel the request and fail with `TIMEOUT` after this many milliseconds. */
  timeoutMs?: number;
}

/** The shape of an error response body sent by the server. */
export interface ErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

/** How long a request may take before it is cancelled, unless the caller says otherwise. */
const DEFAULT_TIMEOUT_MS = 10_000;

/** The HTTP status for "No Content": a success response with no body to read. */
const HTTP_NO_CONTENT = 204;

/** Status codes from 500 upwards mean the server itself failed. */
const FIRST_SERVER_ERROR_STATUS = 500;

// ---------------------------------------------------------------------------
// Step 1: build the URL
// ---------------------------------------------------------------------------

const isEmptyQueryValue = (value: QueryValue): boolean => {
  return value === undefined || value === null || value === "";
};

/**
 * Turns `{ limit: 30, filter: "a b", cursor: null }` into `?limit=30&filter=a%20b`.
 *
 * Built by hand rather than with `URLSearchParams`, because React Native's
 * built-in URL support is incomplete.
 */
const buildQueryString = (query: Record<string, QueryValue> = {}): string => {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(query)) {
    if (isEmptyQueryValue(value)) continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }

  if (parts.length === 0) return "";
  return `?${parts.join("&")}`;
};

const buildUrl = (baseUrl: string, path: string, query?: Record<string, QueryValue>): string => {
  return `${baseUrl}${path}${buildQueryString(query)}`;
};

// ---------------------------------------------------------------------------
// Step 2: build the headers and body
// ---------------------------------------------------------------------------

const buildHeaders = (hasBody: boolean, extraHeaders: Record<string, string> = {}): Record<string, string> => {
  const headers: Record<string, string> = {
    // We always want JSON back.
    Accept: "application/json",
  };

  // Only say we are sending JSON when there is actually a body.
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  // Caller-supplied headers go last so they can override the defaults.
  return { ...headers, ...extraHeaders };
};

const buildBody = (body: unknown): string | undefined => {
  if (body === undefined) return undefined;
  return JSON.stringify(body);
};

// ---------------------------------------------------------------------------
// Step 3: the timeout timer
// ---------------------------------------------------------------------------

/**
 * Starts a timer that cancels the request after `timeoutMs`.
 *
 * Returns:
 * - `signal`: pass this to `fetch` so the request can be cancelled.
 * - `hasTimedOut()`: tells us afterwards whether the timer cancelled it.
 * - `stop()`: call this once the request finishes, so the timer doesn't fire later.
 */
const startTimeoutTimer = (timeoutMs: number) => {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  return {
    signal: controller.signal,
    hasTimedOut: () => timedOut,
    stop: () => clearTimeout(timer),
  };
};

// ---------------------------------------------------------------------------
// Step 5: turn a failed response into an ApiError
// ---------------------------------------------------------------------------

/** Reads the server's error body. Returns `null` if the body isn't valid JSON (e.g. an HTML error page). */
const readErrorBody = async (response: Response): Promise<ErrorBody | null> => {
  try {
    return (await response.json()) as ErrorBody;
  } catch {
    return null;
  }
};

const toApiError = async (response: Response): Promise<ApiError> => {
  const errorBody = await readErrorBody(response);
  const serverError = errorBody?.error;

  // Best case: the server told us exactly what went wrong.
  if (serverError?.code) {
    const code = serverError.code as ApiErrorCode;
    const message = serverError.message ?? "Request failed.";
    const details = serverError.details ?? {};
    return new ApiError(code, message, details);
  }

  // Otherwise, fall back to a general error based on the status code.
  const isServerFailure = response.status >= FIRST_SERVER_ERROR_STATUS;
  if (isServerFailure) {
    return new ApiError("SERVER_ERROR", `The server responded with ${response.status}.`);
  }
  return new ApiError("BAD_REQUEST", `Unexpected response (${response.status}).`);
};

/**
 * Reads a successful response as JSON. If the server sent something that isn't
 * JSON (e.g. a proxy's HTML page with status 200), report a typed error
 * instead of letting a raw `SyntaxError` escape.
 */
const readSuccessBody = async <T>(response: Response): Promise<T> => {
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("SERVER_ERROR", "The server sent a response we couldn't read.");
  }
};

// ---------------------------------------------------------------------------
// The client
// ---------------------------------------------------------------------------

export const createHttpClient = ({ baseUrl, fetch }: { baseUrl: string; fetch: FetchLike }) => {
  /**
   * Sends one request and returns the parsed JSON response.
   * Throws an `ApiError` if anything goes wrong.
   */
  const request = async <T>(method: string, path: string, options: RequestOptions = {}): Promise<T> => {
    const { query, body, headers, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
    const hasBody = body !== undefined;

    // Steps 1–3: prepare the request and start the timeout timer.
    const url = buildUrl(baseUrl, path, query);
    const timer = startTimeoutTimer(timeoutMs);

    // Step 4: send it.
    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: buildHeaders(hasBody, headers),
        body: buildBody(body),
        signal: timer.signal,
      });
    } catch {
      // `fetch` only throws when no response arrived at all:
      // either our timer cancelled the request, or the network failed.
      if (timer.hasTimedOut()) {
        throw new ApiError("TIMEOUT", "The request timed out.");
      }
      throw new ApiError("NETWORK_ERROR", "Unable to reach the server.");
    } finally {
      timer.stop();
    }

    // Step 5: read the response.
    if (!response.ok) {
      throw await toApiError(response);
    }

    if (response.status === HTTP_NO_CONTENT) {
      return undefined as T;
    }

    return readSuccessBody<T>(response);
  };

  const get = <T>(path: string, options?: Omit<RequestOptions, "body">) => {
    return request<T>("GET", path, options);
  };

  const post = <T>(path: string, options?: RequestOptions) => {
    return request<T>("POST", path, options);
  };

  return { get, post };
};

export type HttpClient = ReturnType<typeof createHttpClient>;
