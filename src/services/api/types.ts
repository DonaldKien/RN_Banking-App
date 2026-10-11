import type { Sen } from "@/lib/money";

export interface Bank {
  code: string;
  name: string;
  shortName: string;
}

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

export interface Account {
  id: string;
  holderName: string;
  productName: string;
  accountNumber: string;
  balance: Sen;
  dailyLimit: Sen;
  dailyUsed: Sen;
}

export type TransactionDirection = "debit" | "credit";
export type TransactionStatus = "completed" | "pending" | "failed";
export type TransactionFilter = "all" | TransactionDirection;

export interface Transaction {
  id: string;
  reference: string;
  direction: TransactionDirection;
  amount: Sen;
  /** Snapshot at the time of the transaction. */
  counterparty: Recipient;
  note?: string;
  createdAt: string;
  status: TransactionStatus;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

/**
 * Proof the user approved this transfer. In production `assertion` would be a
 * server nonce signed by a biometric-bound key; PIN tokens are single-use.
 */
export type TransferAuthorization =
  | { method: "biometric" | "device_credential"; assertion: string }
  | { method: "pin"; token: string };

export interface TransferRequest {
  /** Replaying the same key never moves money twice. */
  idempotencyKey: string;
  recipient: Recipient;
  amount: Sen;
  note?: string;
  authorization: TransferAuthorization;
}

export interface TransferReceipt {
  transaction: Transaction;
  balanceAfter: Sen;
}

export interface AccountLookupRequest {
  type: RecipientType;
  accountId: string;
  bankCode?: string;
}

export interface AccountLookupResult {
  name: string;
}

export type MockScenario = "none" | "network_error" | "timeout" | "server_error" | "insufficient_funds";
