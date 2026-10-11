export type ApiErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "SERVER_ERROR"
  | "BAD_REQUEST"
  | "INSUFFICIENT_FUNDS"
  | "DAILY_LIMIT_EXCEEDED"
  | "LIMIT_EXCEEDED"
  | "INVALID_AMOUNT"
  | "INVALID_RECIPIENT"
  | "ACCOUNT_NOT_FOUND"
  | "AUTH_REQUIRED"
  | "INVALID_PIN"
  | "PIN_LOCKED"
  | "NOT_FOUND";

/** Errors that are safe to retry automatically or offer a "Try again" for. */
const RETRYABLE_CODES: readonly ApiErrorCode[] = ["NETWORK_ERROR", "TIMEOUT", "SERVER_ERROR"];

/** A typed error returned by the banking API. UI code switches on `code`, never on `message`. */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly details: Record<string, unknown>;

  constructor(code: ApiErrorCode, message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }

  get retryable(): boolean {
    return RETRYABLE_CODES.includes(this.code);
  }
}

export const isApiError = (error: unknown): error is ApiError => {
  // Check the brand as well as the prototype so the guard survives transpiled class hierarchies.
  return error instanceof ApiError || (error as { name?: unknown } | null)?.name === "ApiError";
};

export const isRetryableError = (error: unknown): boolean => {
  return isApiError(error) && RETRYABLE_CODES.includes(error.code);
};
