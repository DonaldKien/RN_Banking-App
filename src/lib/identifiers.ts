/**
 * Format rules for payment identifiers. Shared by client-side validation and
 * the mock server so both agree on what a well-formed identifier looks like.
 */

export const ACCOUNT_NUMBER_MIN_LENGTH = 10;
export const ACCOUNT_NUMBER_MAX_LENGTH = 16;

export const digitsOnly = (value: string): string => {
  return value.replace(/\D/g, "");
};

export const isValidAccountNumber = (value: string): boolean => {
  const digits = digitsOnly(value);
  return digits.length >= ACCOUNT_NUMBER_MIN_LENGTH && digits.length <= ACCOUNT_NUMBER_MAX_LENGTH;
};

/**
 * Normalises a Malaysian mobile number to E.164 digits without the plus sign
 * (`"012-345 6789"` → `"60123456789"`). Returns `null` when it is not a valid
 * Malaysian mobile number.
 */
export const normaliseMalaysianMobile = (value: string): string | null => {
  let digits = digitsOnly(value);
  if (digits.startsWith("60")) digits = digits.slice(1);
  if (!digits.startsWith("0")) digits = `0${digits}`;
  // 01X followed by 7–8 digits: 10 or 11 digits in local format.
  if (!/^01\d{8,9}$/.test(digits)) return null;
  return `6${digits}`;
};
