import { formatMoney } from "@/lib/money";
import { isApiError } from "@/services/api/errors";

/** What the review screen should offer after a failed transfer. */
export type TransferErrorAction = "retry" | "edit_amount" | "change_recipient" | "reauthenticate";

export interface TransferErrorDescription {
  title: string;
  message: string;
  action: TransferErrorAction;
}

/**
 * Translates API errors into copy that tells the user (1) what happened,
 * (2) whether their money moved, and (3) what to do next.
 */
export const describeTransferError = (error: unknown): TransferErrorDescription => {
  if (!isApiError(error)) {
    return {
      title: "Something went wrong",
      message: "Your transfer wasn't completed and no money has left your account. Please try again.",
      action: "retry",
    };
  }

  switch (error.code) {
    case "NETWORK_ERROR":
      return {
        title: "You're offline",
        message: "We couldn't reach the bank, so no money has moved. Check your connection and try again.",
        action: "retry",
      };
    case "TIMEOUT":
      return {
        title: "This is taking longer than usual",
        message:
          "We didn't get a response in time. Trying again is safe — you will never be charged twice for this transfer.",
        action: "retry",
      };
    case "SERVER_ERROR":
      return {
        title: "Service temporarily unavailable",
        message: "Our transfer service had a problem and no money has moved. Please try again in a moment.",
        action: "retry",
      };
    case "INSUFFICIENT_FUNDS": {
      const balance = error.details.balance;
      return {
        title: "Insufficient funds",
        message:
          typeof balance === "number"
            ? `Your available balance is ${formatMoney(balance)}. Lower the amount and try again.`
            : "Your balance is too low for this transfer. Lower the amount and try again.",
        action: "edit_amount",
      };
    }
    case "DAILY_LIMIT_EXCEEDED": {
      const remaining = error.details.remaining;
      return {
        title: "Daily limit reached",
        message:
          typeof remaining === "number"
            ? `You can transfer up to ${formatMoney(remaining)} more today.`
            : "This transfer exceeds your daily limit.",
        action: "edit_amount",
      };
    }
    case "LIMIT_EXCEEDED":
    case "INVALID_AMOUNT":
      return { title: "Check the amount", message: error.message, action: "edit_amount" };
    case "INVALID_RECIPIENT":
    case "ACCOUNT_NOT_FOUND":
      return { title: "Check the recipient", message: error.message, action: "change_recipient" };
    case "AUTH_REQUIRED":
      return { title: "Approval expired", message: error.message, action: "reauthenticate" };
    default:
      return { title: "Transfer failed", message: error.message, action: "retry" };
  }
};
