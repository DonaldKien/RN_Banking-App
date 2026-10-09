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

/** Converts a ringgit value to sen, e.g. `ringgit(12.5)` → `1250`. For constants and seed data only. */
export const ringgit = (value: number): Sen => {
  return Math.round(value * 100);
};
