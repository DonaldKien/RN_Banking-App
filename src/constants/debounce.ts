/**
 * Every debounce delay in the app, in milliseconds. A debounce waits until
 * the user has stopped typing for this long before doing the work.
 */
export const DEBOUNCE_MS = {
  /** Search boxes: filter the list once typing pauses. */
  search: 200,
} as const;
