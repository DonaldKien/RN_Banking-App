import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import type { ThemeColor } from "@/constants/theme";

/** Label/value pair used in review and receipt summaries. */
export const DetailRow = ({
  label,
  value,
  secondary,
  valueColor = "text",
  mono = false,
}: {
  label: string;
  value: string;
  secondary?: string;
  valueColor?: ThemeColor;
  mono?: boolean;
}) => {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${label}: ${value}${secondary ? `, ${secondary}` : ""}`}>
      <ThemedText variant="caption" color="textSecondary" style={styles.label}>
        {label}
      </ThemedText>
      <View style={styles.valueColumn}>
        <ThemedText variant={mono ? "mono" : "bodyStrong"} color={valueColor} align="right" selectable={mono}>
          {value}
        </ThemedText>
        {secondary && (
          <ThemedText variant="caption" color="textSecondary" align="right">
            {secondary}
          </ThemedText>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    paddingVertical: 12,
  },
  label: {
    paddingTop: 2,
  },
  valueColumn: {
    flexShrink: 1,
    alignItems: "flex-end",
  },
});
