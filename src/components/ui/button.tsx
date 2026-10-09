import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Icon, type IconName } from "@/components/ui/icon";
import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { haptics as hapticFeedback } from "@/lib/haptics";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  size?: "md" | "sm";
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
  /** Play a light "tick" when pressed. Defaults to `true`. */
  haptics?: boolean;
}

export const Button = ({
  title,
  onPress,
  variant = "primary",
  icon,
  loading = false,
  disabled = false,
  size = "md",
  style,
  accessibilityHint,
  testID,
  haptics = true,
}: ButtonProps) => {
  const theme = useTheme();
  const inactive = disabled || loading;

  const palette = {
    primary: { bg: theme.primary, pressed: theme.primaryPressed, fg: theme.onPrimary },
    secondary: { bg: theme.primarySoft, pressed: theme.border, fg: theme.primary },
    ghost: { bg: "transparent", pressed: theme.surfaceMuted, fg: theme.primary },
    danger: { bg: theme.dangerSoft, pressed: theme.border, fg: theme.danger },
  }[variant];

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={() => {
        if (haptics) hapticFeedback.selection();
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        size === "sm" && styles.small,
        { backgroundColor: pressed ? palette.pressed : palette.bg },
        pressed && styles.pressed,
        disabled && !loading && styles.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <View style={styles.content}>
          {icon && <Icon name={icon} size={size === "sm" ? 16 : 20} color={palette.fg} />}
          <ThemedText variant={size === "sm" ? "captionStrong" : "bodyStrong"} style={{ color: palette.fg }}>
            {title}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 54,
    borderRadius: Radius.lg,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  small: {
    minHeight: 38,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
