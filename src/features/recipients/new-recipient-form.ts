/** New-recipient form rules. Valid values are transformed into the name-enquiry request. */
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
  // Only the fields for the chosen recipient type are checked.
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
  .transform((values): AccountLookupRequest => {
    if (values.type === "BANK_ACCOUNT") {
      return { type: values.type, bankCode: values.bankCode, accountId: digitsOnly(values.accountNumber) };
    }
    // Safe: validated above.
    return { type: values.type, accountId: normaliseMalaysianMobile(values.mobile) as string };
  });

export type NewRecipientFormValues = z.input<typeof newRecipientSchema>;

export const NEW_RECIPIENT_DEFAULTS: NewRecipientFormValues = {
  type: "BANK_ACCOUNT",
  bankCode: "",
  accountNumber: "",
  mobile: "",
};

/** The lookup request, or `null` while the values are incomplete. */
export const toLookupRequest = (values: unknown): AccountLookupRequest | null => {
  const result = newRecipientSchema.safeParse(values);
  return result.success ? result.data : null;
};

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
