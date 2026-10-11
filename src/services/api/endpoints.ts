/**
 * Every API endpoint path in one place. Used by the API functions
 * (`bank-api.ts`) to build requests and by the mock server to register its
 * routes, so the two can never drift apart.
 *
 * Paths are relative to `API_BASE_URL`. Path parameters use the `:name`
 * placeholder syntax; fill them in with `buildPath`.
 */
export const API_ENDPOINTS = {
  account: "/v1/accounts/me",
  recipients: "/v1/recipients",
  recentRecipients: "/v1/recipients/recent",
  recipientLookup: "/v1/recipients/lookup",
  transactions: "/v1/transactions",
  transactionDetail: "/v1/transactions/:id",
  verifyPin: "/v1/auth/pin/verify",
  transfers: "/v1/transfers",
  /** Mock-only: restores the seed data. */
  demoReset: "/v1/demo/reset",
} as const;

export type ApiEndpoint = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];

/**
 * Replaces `:name` placeholders with URL-encoded values, e.g.
 * `buildPath(API_ENDPOINTS.transactionDetail, { id: "txn_1" })` → `"/v1/transactions/txn_1"`.
 */
export const buildPath = (pattern: ApiEndpoint, params: Record<string, string>): string => {
  return pattern.replace(/:(\w+)/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Missing path parameter "${name}" for ${pattern}`);
    return encodeURIComponent(value);
  });
};
