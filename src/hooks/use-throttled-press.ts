import { useRef } from "react";

import { THROTTLE_MS } from "@/constants/debounce";

/** `true` = `THROTTLE_MS.press`, a number = that many ms, `false` = off. */
export type ThrottleOption = boolean | number;

export const toThrottleMs = (throttle: ThrottleOption | undefined): number => {
  if (throttle === true) return THROTTLE_MS.press;
  if (typeof throttle === "number" && throttle > 0) return throttle;
  return 0;
};

/**
 * Runs the first tap immediately and drops (not delays) repeats within
 * `throttleMs`. `0` (default) calls straight through.
 */
export const useThrottledPress = <Args extends unknown[]>(
  onPress: (...args: Args) => void,
  throttleMs: number = 0,
): ((...args: Args) => void) => {
  const lastPressAt = useRef(Number.NEGATIVE_INFINITY);

  return (...args: Args) => {
    if (throttleMs <= 0) {
      onPress(...args);
      return;
    }

    const now = Date.now();
    if (now - lastPressAt.current < throttleMs) return;

    lastPressAt.current = now;
    onPress(...args);
  };
};
