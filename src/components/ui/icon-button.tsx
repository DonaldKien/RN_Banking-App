import { StyleSheet } from "react-native";

import { AppPressable } from "@/components/ui/app-pressable";
import { Icon, type IconName } from "@/components/ui/icon";
import { Radius } from "@/constants/theme";
import type { ThrottleOption } from "@/hooks/use-throttled-press";
import { useTheme } from "@/hooks/use-theme";

export const IconButton = ({
  icon,
  label,
  onPress,
  tone = "surface",
  throttle = false,
}: {
  icon: IconName;
  /** Required: icon-only controls need an accessible name. */
  label: string;
  onPress: () => void;
  tone?: "surface" | "onPrimary";
  /** Ignore repeat taps. Turn on for taps that send a POST request: `true` = 250 ms, a number = that many ms. Defaults to `false`. */
  throttle?: ThrottleOption;
}) => {
  const theme = useTheme();
  const color = tone === "onPrimary" ? theme.onPrimary : theme.text;
  const background = tone === "onPrimary" ? "rgba(255,255,255,0.16)" : theme.surface;

  return (
    <AppPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      throttle={throttle}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: background }, pressed && styles.pressed]}>
      <Icon name={icon} size={20} color={color} />
    </AppPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
});
