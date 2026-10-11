/**
 * Every debounce and throttle delay in the app, in milliseconds.
 *
 * - Debounce: wait until the user has stopped (typing) for this long, then act once.
 * - Throttle: act immediately, then ignore repeats for this long.
 */
export const DEBOUNCE_MS = {
  /** Search boxes: filter the list once typing pauses. */
  search: 200,
  /** New-recipient form: ask the bank for the account holder's name once the number is typed. */
  accountLookup: 450,
} as const;

export const THROTTLE_MS = {
  /** Buttons and navigation taps: ignore repeat taps this soon after an accepted one. */
  press: 250,
} as const;
