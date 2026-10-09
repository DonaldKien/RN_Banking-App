/**
 * Wire types shared between the (mock) banking API and the app. In a real
 * project these would be generated from the backend's OpenAPI schema.
 */
import type { Sen } from "@/lib/money";

/** How funds are routed: directly to an account number, or via a DuitNow mobile proxy. */
export type RecipientType = "BANK_ACCOUNT" | "DUITNOW_MOBILE";

export interface Recipient {
  id: string;
  name: string;
  type: RecipientType;
  /** Account number for `BANK_ACCOUNT`, mobile number for `DUITNOW_MOBILE`. */
  accountId: string;
  bankCode?: string;
  bankName: string;
  isFavourite?: boolean;
}

export type TransactionDirection = "debit" | "credit";
export type TransactionStatus = "completed" | "pending" | "failed";

export interface Transaction {
  id: string;
  reference: string;
  direction: TransactionDirection;
  amount: Sen;
  /** Snapshot of the other party at the time of the transaction. */
  counterparty: Recipient;
  note?: string;
  createdAt: string;
  status: TransactionStatus;
}
