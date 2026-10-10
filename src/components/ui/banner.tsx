import { StyleSheet, View } from "react-native";
import Animated, { FadeInUp, FadeOut } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type BannerTone = "danger" | "warning" | "info" | "success";

/** Inline, animated message used for errors and status feedback. */
export const Banner = ({
  tone,
  title,
  message,
  icon,
  actionLabel,
  onAction,
}: {
  tone: BannerTone;
  title?: string;
  message: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}) => {
  const theme = useTheme();
  const colors = {
    danger: { bg: theme.dangerSoft, fg: theme.danger, icon: "error" as const },
    warning: { bg: theme.warningSoft, fg: theme.warning, icon: "info" as const },
    info: { bg: theme.primarySoft, fg: theme.primary, icon: "info" as const },
    success: { bg: theme.successSoft, fg: theme.success, icon: "checkCircle" as const },
  }[tone];

  return (
    <Animated.View
      entering={FadeInUp.duration(250)}
      exiting={FadeOut.duration(150)}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: colors.bg }]}>
      <Icon name={icon ?? colors.icon} size={20} color={colors.fg} style={styles.icon} />
      <View style={styles.body}>
        {title && (
          <ThemedText variant="bodyStrong" style={{ color: colors.fg }}>
            {title}
          </ThemedText>
        )}
        <ThemedText variant="caption" color="text">
          {message}
        </ThemedText>
        {actionLabel && onAction && (
          <Button title={actionLabel} onPress={onAction} size="sm" variant="ghost" style={styles.action} />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: Radius.lg,
  },
  icon: {
    marginTop: 1,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  action: {
    alignSelf: "flex-start",
    marginLeft: -16,
    marginTop: 4,
  },
});
