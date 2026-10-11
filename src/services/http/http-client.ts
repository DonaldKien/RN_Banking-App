/**
 * JSON-over-HTTP client built on `fetch`. Every failure becomes a typed `ApiError`.
 * `fetch` is injected so the same client can hit a real backend or the mock server.
 */
import { ApiError, type ApiErrorCode } from "@/services/api/errors";

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  query?: Record<string, QueryValue>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Abort and fail with `TIMEOUT` after this many ms. */
  timeoutMs?: number;
}

export interface ErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
}

const DEFAULT_TIMEOUT_MS = 10_000;
const HTTP_NO_CONTENT = 204;
const FIRST_SERVER_ERROR_STATUS = 500;

const isEmptyQueryValue = (value: QueryValue): boolean => {
  return value === undefined || value === null || value === "";
};

// Built by hand: React Native's URLSearchParams support is incomplete.
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

const buildHeaders = (hasBody: boolean, extraHeaders: Record<string, string> = {}): Record<string, string> => {
  const headers: Record<string, string> = { Accept: "application/json" };

  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  return { ...headers, ...extraHeaders };
};

const buildBody = (body: unknown): string | undefined => {
  if (body === undefined) return undefined;
  return JSON.stringify(body);
};

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

const readErrorBody = async (response: Response): Promise<ErrorBody | null> => {
  try {
    return (await response.json()) as ErrorBody;
  } catch {
    return null; // e.g. an HTML error page from a proxy
  }
};

const toApiError = async (response: Response): Promise<ApiError> => {
  const serverError = (await readErrorBody(response))?.error;

  if (serverError?.code) {
    const code = serverError.code as ApiErrorCode;
    const message = serverError.message ?? "Request failed.";
    const details = serverError.details ?? {};
    return new ApiError(code, message, details);
  }

  if (response.status >= FIRST_SERVER_ERROR_STATUS) {
    return new ApiError("SERVER_ERROR", `The server responded with ${response.status}.`);
  }
  return new ApiError("BAD_REQUEST", `Unexpected response (${response.status}).`);
};

const readSuccessBody = async <T>(response: Response): Promise<T> => {
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiError("SERVER_ERROR", "The server sent a response we couldn't read.");
  }
};

export const createHttpClient = ({ baseUrl, fetch }: { baseUrl: string; fetch: FetchLike }) => {
  const request = async <T>(method: string, path: string, options: RequestOptions = {}): Promise<T> => {
    const { query, body, headers, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
    const timer = startTimeoutTimer(timeoutMs);

    let response: Response;
    try {
      response = await fetch(buildUrl(baseUrl, path, query), {
        method,
        headers: buildHeaders(body !== undefined, headers),
        body: buildBody(body),
        signal: timer.signal,
      });
    } catch {
      // fetch only throws when no response arrived: our timeout, or the network.
      if (timer.hasTimedOut()) {
        throw new ApiError("TIMEOUT", "The request timed out.");
      }
      throw new ApiError("NETWORK_ERROR", "Unable to reach the server.");
    } finally {
      timer.stop();
    }

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
