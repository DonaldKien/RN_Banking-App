// The one place allowed to import Pressable directly (see the lint rule in eslint.config.js).
// eslint-disable-next-line no-restricted-imports
import { Pressable, type GestureResponderEvent, type PressableProps, type View } from "react-native";
import type { Ref } from "react";

import { toThrottleMs, useThrottledPress, type ThrottleOption } from "@/hooks/use-throttled-press";

export type AppPressableProps = PressableProps & {
  /**
   * Ignore repeat taps for a while after an accepted tap. Turn it on for taps
   * that send a POST request (e.g. confirming a transfer), so a double tap
   * can't send it twice.
   * - `true`: the default cooldown (`THROTTLE_MS.press`, 250 ms)
   * - a number: that many milliseconds, e.g. `throttle={1000}`
   * - `false` / not set (default): no throttle
   */
  throttle?: ThrottleOption;
  ref?: Ref<View>;
};

/**
 * The app's `Pressable`. Use it everywhere instead of React Native's
 * `Pressable`: it accepts exactly the same props, plus an optional `throttle`.
 *
 * @example
 * <AppPressable onPress={openDetails}>…</AppPressable>          // normal tap
 * <AppPressable onPress={submit} throttle>…</AppPressable>        // POST: 250 ms cooldown
 * <AppPressable onPress={submit} throttle={1000}>…</AppPressable> // POST: 1 s cooldown
 */
export const AppPressable = ({ throttle = false, onPress, ref, ...pressableProps }: AppPressableProps) => {
  const throttledPress = useThrottledPress(
    (event: GestureResponderEvent) => onPress?.(event),
    toThrottleMs(throttle),
  );

  return <Pressable ref={ref} onPress={onPress ? throttledPress : undefined} {...pressableProps} />;
};
