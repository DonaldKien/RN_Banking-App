import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, ZoomIn } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

// Not a Modal: iOS can't present one while the PIN sheet's modal is still dismissing.
export const ProcessingOverlay = ({ message }: { message: string }) => {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={[StyleSheet.absoluteFill, styles.backdrop, { backgroundColor: theme.overlay }]}>
      <Animated.View
        entering={ZoomIn.springify().damping(16)}
        style={[styles.card, { backgroundColor: theme.surface }]}
        accessibilityRole="progressbar"
        accessibilityLabel={message}
        accessibilityLiveRegion="polite"
        accessibilityViewIsModal>
        <ActivityIndicator size="large" color={theme.primary} />
        <View style={styles.text}>
          <ThemedText variant="heading" align="center">
            {message}
          </ThemedText>
          <ThemedText variant="caption" color="textSecondary" align="center">
            Please keep the app open.
          </ThemedText>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    borderRadius: Radius.xl,
    padding: 32,
    alignItems: "center",
    gap: 16,
  },
  text: {
    gap: 4,
  },
});
