import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MaxContentWidth } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

/**
 * Scrollable screen body with a footer pinned above the keyboard and the
 * home indicator — the layout used by every step of the transfer flow.
 */
export const FormScreen = ({ children, footer }: { children: ReactNode; footer?: ReactNode }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive">
        <View style={styles.inner}>{children}</View>
      </ScrollView>
      {footer && (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 16),
              backgroundColor: theme.background,
              borderTopColor: theme.border,
            },
          ]}>
          <View style={styles.inner}>{footer}</View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    alignItems: "center",
  },
  inner: {
    width: "100%",
    maxWidth: MaxContentWidth,
    gap: 16,
    alignSelf: "center",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
