import { useEffect } from "react";
import type { DimensionValue, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/** Pulsing placeholder shown while data loads, sized like the content it replaces. */
export const Skeleton = ({
  width = "100%",
  height = 16,
  radius = Radius.sm,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) => {
  const theme = useTheme();
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.set(withRepeat(withTiming(1, { duration: 800 }), -1, true));
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

  return (
    <Animated.View
      accessibilityLabel="Loading"
      style={[{ width, height, borderRadius: radius, backgroundColor: theme.surfaceMuted }, animatedStyle, style]}
    />
  );
};
