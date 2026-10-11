// Shared by bank-api.ts and the mock server's routes, so they can't drift apart.
export const API_ENDPOINTS = {
  account: "/v1/accounts/me",
  recipients: "/v1/recipients",
  recentRecipients: "/v1/recipients/recent",
  recipientLookup: "/v1/recipients/lookup",
  transactions: "/v1/transactions",
  transactionDetail: "/v1/transactions/:id",
  verifyPin: "/v1/auth/pin/verify",
  transfers: "/v1/transfers",
  /** Mock-only. */
  demoReset: "/v1/demo/reset",
} as const;

export type ApiEndpoint = (typeof API_ENDPOINTS)[keyof typeof API_ENDPOINTS];

/** `buildPath(API_ENDPOINTS.transactionDetail, { id: "txn_1" })` → `"/v1/transactions/txn_1"`. */
export const buildPath = (pattern: ApiEndpoint, params: Record<string, string>): string => {
  return pattern.replace(/:(\w+)/g, (_, name: string) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Missing path parameter "${name}" for ${pattern}`);
    return encodeURIComponent(value);
  });
};
