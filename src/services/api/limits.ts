import { ringgit, type Sen } from "@/lib/money";

/**
 * Business limits published by the API. The client validates against the same
 * values for instant feedback; the server remains the source of truth.
 */
export const TRANSFER_LIMITS = {
  minAmount: 1 as Sen,
  maxAmount: ringgit(50_000),
  noteMaxLength: 140,
} as const;
