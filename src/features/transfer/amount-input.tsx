import { useRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { AppPressable } from "@/components/ui/app-pressable";
import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { Fonts, Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { haptics } from "@/lib/haptics";
import { CURRENCY_SYMBOL, formatMoney, ringgit, senToAmountText, type Sen } from "@/lib/money";

const QUICK_AMOUNTS: readonly Sen[] = [ringgit(50), ringgit(100), ringgit(200), ringgit(500)];

export const AmountInput = ({
  value,
  onChangeText,
  amount,
  balance,
  error,
}: {
  value: string;
  onChangeText: (text: string) => void;
  amount: Sen | null;
  balance: Sen | undefined;
  error?: string;
}) => {
  const theme = useTheme();
  const inputRef = useRef<TextInput>(null);

  const remaining = balance !== undefined && amount !== null ? balance - amount : undefined;
  const helper =
    error ??
    (remaining !== undefined && amount
      ? `Balance after transfer: ${formatMoney(remaining)}`
      : balance !== undefined
        ? `Available: ${formatMoney(balance)}`
        : " ");

  return (
    <Card style={[styles.card, error && { borderColor: theme.danger }]}>
      <ThemedText variant="captionStrong" color="textSecondary">
        Amount
      </ThemedText>

      <AppPressable style={styles.inputRow} onPress={() => inputRef.current?.focus()} accessible={false}>
        <ThemedText variant="title" color={value ? "text" : "textTertiary"} style={styles.currency}>
          {CURRENCY_SYMBOL}
        </ThemedText>
        <TextInput
          ref={inputRef}
          testID="amount-input"
          value={value}
          onChangeText={onChangeText}
          placeholder="0.00"
          placeholderTextColor={theme.textTertiary}
          keyboardType="decimal-pad"
          inputMode="decimal"
          selectionColor={theme.primary}
          accessibilityLabel="Amount in ringgit"
          accessibilityHint={helper}
          style={[styles.input, { color: error ? theme.danger : theme.text }]}
        />
      </AppPressable>

      <ThemedText
        variant="caption"
        color={error ? "danger" : "textSecondary"}
        accessibilityLiveRegion="polite">
        {helper}
      </ThemedText>

      <View style={styles.chips}>
        {QUICK_AMOUNTS.map((quick) => {
          const selected = amount === quick;
          const unaffordable = balance !== undefined && quick > balance;
          return (
            <AppPressable
              key={quick}
              accessibilityRole="button"
              accessibilityLabel={`Set amount to ${formatMoney(quick)}`}
              accessibilityState={{ selected, disabled: unaffordable }}
              disabled={unaffordable}
              onPress={() => {
                haptics.selection();
                onChangeText(senToAmountText(quick));
              }}
              style={[
                styles.chip,
                { backgroundColor: selected ? theme.primary : theme.surfaceMuted },
                unaffordable && styles.chipDisabled,
              ]}>
              <ThemedText variant="captionStrong" style={{ color: selected ? theme.onPrimary : theme.text }}>
                {formatMoney(quick).replace(".00", "")}
              </ThemedText>
            </AppPressable>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: 8,
    paddingVertical: 24,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currency: {
    fontFamily: Fonts.rounded,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.rounded,
    fontSize: 40,
    fontWeight: "700",
    paddingVertical: 4,
    fontVariant: ["tabular-nums"],
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  chipDisabled: {
    opacity: 0.4,
  },
});
