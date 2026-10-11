/** Integer sen (1/100 MYR), so amounts never suffer floating-point drift. */
export type Sen = number;

export const CURRENCY_SYMBOL = "RM";

/** Up to RM 9,999,999. */
const MAX_INTEGER_DIGITS = 7;

const groupThousands = (digits: string): string => {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/** `123456` → `"RM 1,234.56"`. Hand-rolled (not `Intl`) for identical output on every engine. */
export const formatMoney = (
  sen: Sen,
  { signed = false, symbol = true }: { signed?: boolean; symbol?: boolean } = {},
): string => {
  const negative = sen < 0;
  const abs = Math.abs(Math.round(sen));
  const whole = groupThousands(Math.floor(abs / 100).toString());
  const cents = (abs % 100).toString().padStart(2, "0");
  const body = `${symbol ? `${CURRENCY_SYMBOL} ` : ""}${whole}.${cents}`;

  if (negative) return `-${body}`;
  if (signed && sen > 0) return `+${body}`;
  return body;
};

/** Keeps digits and one decimal point (max 2 decimals), strips leading zeros. */
export const sanitizeAmountInput = (raw: string): string => {
  // Some locales' keypads show a comma as the decimal separator.
  const normalised = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const [intPartRaw = "", ...rest] = normalised.split(".");
  const hasDot = rest.length > 0;
  const decimals = rest.join("").slice(0, 2);

  let intPart = intPartRaw.replace(/^0+(?=\d)/, "").slice(0, MAX_INTEGER_DIGITS);
  if (hasDot && intPart === "") intPart = "0";

  return hasDot ? `${intPart}.${decimals}` : intPart;
};

/** `"12.5"` → `1250`; `null` while incomplete (`""`, `"."`). */
export const amountTextToSen = (text: string): Sen | null => {
  const match = /^(\d*)(?:\.(\d{0,2}))?$/.exec(text.trim());
  if (!match) return null;
  const [, intPart = "", decPart = ""] = match;
  if (intPart === "" && decPart === "") return null;
  return Number(intPart || "0") * 100 + Number(decPart.padEnd(2, "0"));
};

/** `5000` → `"50"`, `1250` → `"12.50"`. */
export const senToAmountText = (sen: Sen): string => {
  const whole = Math.floor(sen / 100);
  const cents = sen % 100;
  return cents === 0 ? `${whole}` : `${whole}.${cents.toString().padStart(2, "0")}`;
};

/** `ringgit(12.5)` → `1250`. For constants and tests. */
export const ringgit = (value: number): Sen => {
  return Math.round(value * 100);
};
