/**
 * Wire types shared between the (mock) banking API and the app. In a real
 * project these would be generated from the backend's OpenAPI schema.
 */
import type { Sen } from "@/lib/money";

export interface Bank {
  code: string;
  name: string;
  shortName: string;
}

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
  /** Snapshot of the other party at the time of the transaction. */
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
 * Proof that the user approved this specific transfer.
 *
 * Device auth (biometrics / passcode) carries an `assertion`; in production
 * this would be a server nonce signed by a key held in the Secure Enclave /
 * Android Keystore that is only unlocked by a successful biometric check.
 * PIN auth carries a single-use token issued by `verifyPin`.
 */
export type TransferAuthorization =
  | { method: "biometric" | "device_credential"; assertion: string }
  | { method: "pin"; token: string };

export interface TransferRequest {
  /** Client-generated key; replaying a request with the same key never moves money twice. */
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
