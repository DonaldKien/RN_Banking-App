/**
 * Centralised query-key factory. Keys are hierarchical so related data can be
 * invalidated together, e.g. `queryKeys.transactions.all` after a transfer.
 */
export const queryKeys = {
  device: {
    authCapability: ["device", "auth-capability"] as const,
    contacts: ["device", "contacts"] as const,
    contactsPermission: ["device", "contacts-permission"] as const,
  },
};
