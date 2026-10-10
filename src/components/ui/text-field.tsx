import { useState, type ReactNode, type Ref } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  helper?: string;
  /** Shows a `current/max` counter when `maxLength` is set. */
  showCounter?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  ref?: Ref<TextInput>;
}

export const TextField = ({
  label,
  error,
  helper,
  showCounter,
  leading,
  trailing,
  maxLength,
  value,
  onFocus,
  onBlur,
  ref,
  ...inputProps
}: TextFieldProps) => {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.danger : focused ? theme.primary : theme.border;

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText variant="captionStrong" color="textSecondary">
          {label}
        </ThemedText>
      )}
      <View style={[styles.field, { backgroundColor: theme.surface, borderColor }]}>
        {leading}
        <TextInput
          ref={ref}
          value={value}
          maxLength={maxLength}
          placeholderTextColor={theme.textTertiary}
          selectionColor={theme.primary}
          accessibilityLabel={label ?? inputProps.placeholder}
          accessibilityHint={error ?? helper}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, { color: theme.text }]}
          {...inputProps}
        />
        {trailing}
      </View>
      {(error || helper || (showCounter && maxLength)) && (
        <View style={styles.meta}>
          <ThemedText variant="caption" color={error ? "danger" : "textSecondary"} style={styles.metaText}>
            {error ?? helper ?? ""}
          </ThemedText>
          {showCounter && maxLength !== undefined && (
            <ThemedText variant="caption" color="textTertiary">
              {value?.length ?? 0}/{maxLength}
            </ThemedText>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  metaText: {
    flex: 1,
  },
});
