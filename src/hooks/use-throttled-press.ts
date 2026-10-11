import { useRef } from "react";

import { THROTTLE_MS } from "@/constants/debounce";

/**
 * How a pressable is throttled:
 * - `false` / not set: no throttle, every tap counts.
 * - `true`: ignore repeat taps for the default `THROTTLE_MS.press`.
 * - a number: ignore repeat taps for that many milliseconds.
 */
export type ThrottleOption = boolean | number;

/** Converts a `throttle` prop into a cooldown in milliseconds (`0` means no throttle). */
export const toThrottleMs = (throttle: ThrottleOption | undefined): number => {
  if (throttle === true) return THROTTLE_MS.press;
  if (typeof throttle === "number" && throttle > 0) return throttle;
  return 0;
};

/**
 * Wraps a press handler so repeat taps are ignored for `throttleMs` after an
 * accepted tap. The first tap runs immediately; taps that come too soon are
 * dropped (not delayed), so an accidental double tap can't run the action twice
 * (e.g. send the same POST request twice).
 *
 * With `throttleMs` of `0` (the default) there is no throttle: every tap calls
 * `onPress` straight away, without any timing checks.
 *
 * @param onPress The handler to protect. Its arguments are passed through.
 * @param throttleMs How long to ignore repeats, in ms. Defaults to `0` (no throttle).
 *
 * Usually you don't call this directly: pass `throttle` to `AppPressable`,
 * `Button` or `IconButton`, which use it internally.
 *
 * @example
 * const submit = useThrottledPress(() => resetDemoData(), THROTTLE_MS.press); // a POST request
 * <AppPressable onPress={submit} />
 */
export const useThrottledPress = <Args extends unknown[]>(
  onPress: (...args: Args) => void,
  throttleMs: number = 0,
): ((...args: Args) => void) => {
  // When the last accepted tap happened. Starts far in the past so the first tap always runs.
  // (Hooks must always run, so this ref exists even when there's no throttle.)
  const lastPressAt = useRef(Number.NEGATIVE_INFINITY);

  return (...args: Args) => {
    // No throttle: call straight through.
    if (throttleMs <= 0) {
      onPress(...args);
      return;
    }

    // Throttle: ignore this tap if it came too soon after the last accepted one.
    const now = Date.now();
    if (now - lastPressAt.current < throttleMs) return;

    lastPressAt.current = now;
    onPress(...args);
  };
};
