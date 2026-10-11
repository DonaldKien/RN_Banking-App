/**
 * Every debounce delay in the app, in milliseconds. A debounce waits until
 * the user has stopped typing for this long before doing the work.
 */
export const DEBOUNCE_MS = {
  /** Search boxes: filter the list once typing pauses. */
  search: 200,
  /** New-recipient form: ask the bank for the account holder's name once the number is typed. */
  accountLookup: 450,
} as const;
