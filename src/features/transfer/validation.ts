/**
 * Pure validation rules for the transfer form. Kept free of React so they are
 * trivially unit-testable and reusable (e.g. by a future scheduled-transfer flow).
 */
import { formatMoney, type Sen } from "@/lib/money";
import { TRANSFER_LIMITS } from "@/services/api/limits";
import type { Recipient } from "@/services/api/types";

export type TransferField = "recipient" | "amount" | "note";
export type TransferFieldErrors = Partial<Record<TransferField, string>>;

export interface AmountContext {
  /** Current available balance, when known. */
  balance?: Sen;
  /** What's left of today's transfer limit, when known. */
  dailyRemaining?: Sen;
}

const NOTE_PATTERN = /^[A-Za-z0-9\s.,'\-/&()#@!?:+]*$/;

export const validateRecipient = (
  recipient: Recipient | null,
  ownAccountNumber?: string,
): string | undefined => {
  if (!recipient) return "Choose who you're sending money to.";
  if (ownAccountNumber && recipient.accountId === ownAccountNumber) {
    return "You can't transfer to your own account.";
  }
  return undefined;
};

export const validateAmount = (amount: Sen | null, context: AmountContext = {}): string | undefined => {
  if (amount === null) return "Enter an amount.";
  if (amount < TRANSFER_LIMITS.minAmount) return "Enter an amount greater than RM 0.00.";
  if (amount > TRANSFER_LIMITS.maxAmount) {
    return `The maximum per transfer is ${formatMoney(TRANSFER_LIMITS.maxAmount)}.`;
  }
  if (context.balance !== undefined && amount > context.balance) {
    return `Insufficient balance. You have ${formatMoney(context.balance)} available.`;
  }
  if (context.dailyRemaining !== undefined && amount > context.dailyRemaining) {
    return `This exceeds your remaining daily limit of ${formatMoney(context.dailyRemaining)}.`;
  }
  return undefined;
};

export const validateNote = (note: string): string | undefined => {
  if (note.length > TRANSFER_LIMITS.noteMaxLength) {
    return `Keep your note under ${TRANSFER_LIMITS.noteMaxLength} characters.`;
  }
  if (!NOTE_PATTERN.test(note)) {
    return "Notes can only contain letters, numbers and basic punctuation.";
  }
  return undefined;
};

export const validateTransfer = (input: {
  recipient: Recipient | null;
  amount: Sen | null;
  note: string;
  ownAccountNumber?: string;
} & AmountContext): TransferFieldErrors => {
  const errors: TransferFieldErrors = {};
  const recipient = validateRecipient(input.recipient, input.ownAccountNumber);
  const amount = validateAmount(input.amount, input);
  const note = validateNote(input.note);
  if (recipient) errors.recipient = recipient;
  if (amount) errors.amount = amount;
  if (note) errors.note = note;
  return errors;
};

export const hasErrors = (errors: TransferFieldErrors): boolean => {
  return Object.keys(errors).length > 0;
};
