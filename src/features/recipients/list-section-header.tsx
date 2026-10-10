import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

/** Sticky section header for virtualised lists; opaque so rows scroll beneath it. */
export const ListSectionHeader = ({ label }: { label: string }) => {
  const theme = useTheme();
  return (
    <View style={[styles.header, { backgroundColor: theme.background }]} accessibilityRole="header">
      <ThemedText variant="label" color="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
});
