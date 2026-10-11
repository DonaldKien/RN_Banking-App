import type { AccountLookupRequest, TransactionFilter } from "@/services/api/types";

/**
 * Centralised query-key factory. Keys are hierarchical so related data can be
 * invalidated together, e.g. `queryKeys.transactions.all` after a transfer.
 */
export const queryKeys = {
  account: ["account"] as const,
  recipients: {
    all: ["recipients"] as const,
    saved: ["recipients", "saved"] as const,
    recent: ["recipients", "recent"] as const,
    lookup: (request: AccountLookupRequest) => ["recipients", "lookup", request] as const,
  },
  transactions: {
    all: ["transactions"] as const,
    list: (filter: TransactionFilter) => ["transactions", "list", filter] as const,
    detail: (id: string) => ["transactions", "detail", id] as const,
  },
  device: {
    authCapability: ["device", "auth-capability"] as const,
    contacts: ["device", "contacts"] as const,
    contactsPermission: ["device", "contacts-permission"] as const,
  },
};
