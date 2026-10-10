/**
 * Money helpers.
 *
 * Every amount in the app is an integer number of sen (1/100 MYR). Doing
 * arithmetic on integers avoids floating-point drift (0.1 + 0.2 !== 0.3),
 * which is unacceptable for balances. Conversion to/from decimal strings only
 * happens at the UI boundary.
 */

/** Integer amount in minor units (sen). */
export type Sen = number;

export const CURRENCY_SYMBOL = "RM";

/** Largest number of integer digits the amount field accepts (RM 9,999,999). */
const MAX_INTEGER_DIGITS = 7;

const groupThousands = (digits: string): string => {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Formats sen as a currency string, e.g. `123456` → `"RM 1,234.56"`.
 * Implemented by hand rather than with `Intl` so output is identical on every
 * JS engine and locale configuration.
 */
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

/**
 * Sanitises raw keyboard input for an amount field as the user types:
 * keeps digits and a single decimal point, limits to two decimal places,
 * strips leading zeros and caps the integer part length.
 */
export const sanitizeAmountInput = (raw: string): string => {
  // Accept a comma as decimal separator for locales whose keypad shows one.
  const normalised = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const [intPartRaw = "", ...rest] = normalised.split(".");
  const hasDot = rest.length > 0;
  const decimals = rest.join("").slice(0, 2);

  let intPart = intPartRaw.replace(/^0+(?=\d)/, "").slice(0, MAX_INTEGER_DIGITS);
  if (hasDot && intPart === "") intPart = "0";

  return hasDot ? `${intPart}.${decimals}` : intPart;
};

/**
 * Converts a sanitised amount string to sen. Returns `null` when the string
 * does not represent a number yet (e.g. `""` or `"."`).
 */
export const amountTextToSen = (text: string): Sen | null => {
  const match = /^(\d*)(?:\.(\d{0,2}))?$/.exec(text.trim());
  if (!match) return null;
  const [, intPart = "", decPart = ""] = match;
  if (intPart === "" && decPart === "") return null;
  return Number(intPart || "0") * 100 + Number(decPart.padEnd(2, "0"));
};

/** Converts sen to an editable amount string, e.g. `5000` → `"50"`, `1250` → `"12.50"`. */
export const senToAmountText = (sen: Sen): string => {
  const whole = Math.floor(sen / 100);
  const cents = sen % 100;
  return cents === 0 ? `${whole}` : `${whole}.${cents.toString().padStart(2, "0")}`;
};

/** Converts a ringgit value to sen, e.g. `ringgit(12.5)` → `1250`. For constants and seed data only. */
export const ringgit = (value: number): Sen => {
  return Math.round(value * 100);
};
