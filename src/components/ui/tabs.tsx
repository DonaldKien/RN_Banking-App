import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/ui/app-pressable";
import { ThemedText } from "@/components/themed-text";
import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { haptics as hapticFeedback } from "@/lib/haptics";

export interface TabOption<T extends string> {
  value: T;
  label: string;
}

export interface TabsProps<T extends string> {
  options: readonly TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  haptics?: boolean;
}

export const Tabs = <T extends string>({ options, value, onChange, haptics = true }: TabsProps<T>) => {
  const theme = useTheme();

  const select = (next: T) => {
    if (next === value) return;
    if (haptics) hapticFeedback.selection();
    onChange(next);
  };

  return (
    <View accessibilityRole="tablist" style={[styles.track, { backgroundColor: theme.surfaceMuted }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <AppPressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => select(option.value)}
            style={[styles.tab, selected && { backgroundColor: theme.surface }]}>
            <ThemedText variant="captionStrong" color={selected ? "text" : "textSecondary"}>
              {option.label}
            </ThemedText>
          </AppPressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: 4,
    borderRadius: Radius.md,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: Radius.sm,
  },
});
