import {
  NEW_RECIPIENT_DEFAULTS,
  NEW_RECIPIENT_MESSAGES,
  newRecipientSchema,
  toLookupRequest,
} from "../new-recipient-form";

/** Error messages per field, e.g. `{ bankCode: "Choose a bank." }`. */
const errorsFor = (values: unknown): Record<string, string> => {
  const result = newRecipientSchema.safeParse(values);
  if (result.success) return {};
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path.join("."), issue.message]));
};

describe("newRecipientSchema", () => {
  describe("bank account", () => {
    it("requires a bank and a 10–16 digit account number", () => {
      expect(errorsFor(NEW_RECIPIENT_DEFAULTS)).toEqual({
        bankCode: NEW_RECIPIENT_MESSAGES.bankRequired,
        accountNumber: NEW_RECIPIENT_MESSAGES.accountNumberInvalid,
      });
      expect(errorsFor({ ...NEW_RECIPIENT_DEFAULTS, bankCode: "MBB", accountNumber: "123" })).toEqual({
        accountNumber: NEW_RECIPIENT_MESSAGES.accountNumberInvalid,
      });
    });

    it("turns valid values into a lookup request", () => {
      const request = toLookupRequest({ ...NEW_RECIPIENT_DEFAULTS, bankCode: "MBB", accountNumber: "1234567890" });
      expect(request).toEqual({ type: "BANK_ACCOUNT", bankCode: "MBB", accountId: "1234567890" });
    });

    it("ignores the mobile field", () => {
      const values = { ...NEW_RECIPIENT_DEFAULTS, bankCode: "MBB", accountNumber: "1234567890", mobile: "nonsense" };
      expect(errorsFor(values)).toEqual({});
    });
  });

  describe("mobile number", () => {
    const mobileDefaults = { ...NEW_RECIPIENT_DEFAULTS, type: "DUITNOW_MOBILE" as const };

    it("requires a Malaysian mobile number and ignores the bank fields", () => {
      expect(errorsFor(mobileDefaults)).toEqual({ mobile: NEW_RECIPIENT_MESSAGES.mobileInvalid });
      expect(errorsFor({ ...mobileDefaults, mobile: "03-1234 5678" })).toEqual({
        mobile: NEW_RECIPIENT_MESSAGES.mobileInvalid,
      });
    });

    it("normalises the number in the lookup request", () => {
      expect(toLookupRequest({ ...mobileDefaults, mobile: "012-345 6789" })).toEqual({
        type: "DUITNOW_MOBILE",
        accountId: "60123456789",
      });
    });
  });

  it("returns null for incomplete values", () => {
    expect(toLookupRequest({})).toBeNull();
    expect(toLookupRequest(NEW_RECIPIENT_DEFAULTS)).toBeNull();
  });
});
