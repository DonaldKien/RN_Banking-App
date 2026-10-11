// The only file allowed to import Pressable directly (see eslint.config.js).
// eslint-disable-next-line no-restricted-imports
import { Pressable, type GestureResponderEvent, type PressableProps, type View } from "react-native";
import type { Ref } from "react";

import { toThrottleMs, useThrottledPress, type ThrottleOption } from "@/hooks/use-throttled-press";

export type AppPressableProps = PressableProps & {
  /** Ignore repeat taps (`true` = 250 ms, or a number of ms). Use for taps that send a POST. */
  throttle?: ThrottleOption;
  ref?: Ref<View>;
};

export const AppPressable = ({ throttle = false, onPress, ref, ...pressableProps }: AppPressableProps) => {
  const throttledPress = useThrottledPress(
    (event: GestureResponderEvent) => onPress?.(event),
    toThrottleMs(throttle),
  );

  return <Pressable ref={ref} onPress={onPress ? throttledPress : undefined} {...pressableProps} />;
};
