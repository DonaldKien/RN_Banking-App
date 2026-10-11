import { ringgit, type Sen } from "@/lib/money";

// The client validates against these for instant feedback; the server is the source of truth.
export const TRANSFER_LIMITS = {
  minAmount: 1 as Sen,
  maxAmount: ringgit(50_000),
  noteMaxLength: 140,
} as const;
