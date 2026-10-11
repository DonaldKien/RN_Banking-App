/**
 * Form rules for adding a new recipient, written as a Zod schema.
 *
 * The form always has all four fields, but which ones are checked depends on
 * the recipient type:
 *   - Bank account → a bank must be chosen and the account number must be valid.
 *   - Mobile number (DuitNow) → the mobile number must be a Malaysian mobile.
 *
 * When the values are valid, the schema also converts them into the request
 * the name-enquiry API expects (`AccountLookupRequest`), so the screen never
 * has to do that conversion itself.
 */
import { z } from "zod";

import {
  ACCOUNT_NUMBER_MAX_LENGTH,
  ACCOUNT_NUMBER_MIN_LENGTH,
  digitsOnly,
  isValidAccountNumber,
  normaliseMalaysianMobile,
} from "@/lib/identifiers";
import { DUITNOW_LABEL, findBank } from "@/services/api/banks";
import type { AccountLookupRequest, Recipient } from "@/services/api/types";

export const NEW_RECIPIENT_MESSAGES = {
  bankRequired: "Choose a bank.",
  accountNumberInvalid: `Account numbers have ${ACCOUNT_NUMBER_MIN_LENGTH}–${ACCOUNT_NUMBER_MAX_LENGTH} digits.`,
  mobileInvalid: "Enter a Malaysian mobile number, e.g. 012-345 6789.",
} as const;

export const newRecipientSchema = z
  .object({
    type: z.enum(["BANK_ACCOUNT", "DUITNOW_MOBILE"]),
    bankCode: z.string(),
    accountNumber: z.string(),
    mobile: z.string(),
  })
  // Check only the fields that matter for the chosen recipient type.
  .superRefine((values, ctx) => {
    if (values.type === "BANK_ACCOUNT") {
      if (!values.bankCode) {
        ctx.addIssue({ code: "custom", path: ["bankCode"], message: NEW_RECIPIENT_MESSAGES.bankRequired });
      }
      if (!isValidAccountNumber(values.accountNumber)) {
        ctx.addIssue({
          code: "custom",
          path: ["accountNumber"],
          message: NEW_RECIPIENT_MESSAGES.accountNumberInvalid,
        });
      }
      return;
    }

    if (normaliseMalaysianMobile(values.mobile) === null) {
      ctx.addIssue({ code: "custom", path: ["mobile"], message: NEW_RECIPIENT_MESSAGES.mobileInvalid });
    }
  })
  // Valid values → the name-enquiry request.
  .transform((values): AccountLookupRequest => {
    if (values.type === "BANK_ACCOUNT") {
      return { type: values.type, bankCode: values.bankCode, accountId: digitsOnly(values.accountNumber) };
    }
    // Safe: the check above guarantees this is a valid mobile number.
    return { type: values.type, accountId: normaliseMalaysianMobile(values.mobile) as string };
  });

/** What the form holds while the user is typing. */
export type NewRecipientFormValues = z.input<typeof newRecipientSchema>;

export const NEW_RECIPIENT_DEFAULTS: NewRecipientFormValues = {
  type: "BANK_ACCOUNT",
  bankCode: "",
  accountNumber: "",
  mobile: "",
};

/**
 * Returns the lookup request if the current values are valid, otherwise `null`.
 * Used to start the name enquiry live, while the user is still typing.
 */
export const toLookupRequest = (values: unknown): AccountLookupRequest | null => {
  const result = newRecipientSchema.safeParse(values);
  return result.success ? result.data : null;
};

/**
 * Builds the recipient to send money to, from the validated details and the
 * name the bank confirmed.
 */
export const toRecipient = (request: AccountLookupRequest, verifiedName: string): Recipient => {
  const bankName =
    request.type === "DUITNOW_MOBILE" ? DUITNOW_LABEL : (findBank(request.bankCode)?.shortName ?? "");

  return {
    id: `new:${request.type}:${request.accountId}`,
    name: verifiedName,
    type: request.type,
    accountId: request.accountId,
    bankCode: request.bankCode,
    bankName,
  };
};
