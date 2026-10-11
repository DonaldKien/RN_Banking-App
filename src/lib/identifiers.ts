export const ACCOUNT_NUMBER_MIN_LENGTH = 10;
export const ACCOUNT_NUMBER_MAX_LENGTH = 16;

export const digitsOnly = (value: string): string => {
  return value.replace(/\D/g, "");
};

export const isValidAccountNumber = (value: string): boolean => {
  const digits = digitsOnly(value);
  return digits.length >= ACCOUNT_NUMBER_MIN_LENGTH && digits.length <= ACCOUNT_NUMBER_MAX_LENGTH;
};

/** `"012-345 6789"` → `"60123456789"`, or `null` if not a Malaysian mobile. */
export const normaliseMalaysianMobile = (value: string): string | null => {
  let digits = digitsOnly(value);
  if (digits.startsWith("60")) digits = digits.slice(1);
  if (!digits.startsWith("0")) digits = `0${digits}`;
  if (!/^01\d{8,9}$/.test(digits)) return null;
  return `6${digits}`;
};
