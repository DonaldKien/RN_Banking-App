import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/ui/app-pressable";
import { ThemedText } from "@/components/themed-text";
import { Icon } from "@/components/ui/icon";
import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { formatTime } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import type { Transaction } from "@/services/api/types";

export const TransactionRow = memo(({
  transaction,
  onPress,
  hideAmount = false,
}: {
  transaction: Transaction;
  onPress: (transaction: Transaction) => void;
  hideAmount?: boolean;
}) => {
  const theme = useTheme();
  const isCredit = transaction.direction === "credit";
  const signedAmount = isCredit ? transaction.amount : -transaction.amount;
  const amountLabel = hideAmount ? "RM •••" : formatMoney(signedAmount, { signed: true });
  const subtitle = transaction.note
    ? `${transaction.note} · ${formatTime(transaction.createdAt)}`
    : formatTime(transaction.createdAt);

  return (
    <AppPressable
      accessibilityRole="button"
      accessibilityLabel={`${isCredit ? "Received from" : "Sent to"} ${transaction.counterparty.name}, ${amountLabel}, ${subtitle}`}
      onPress={() => onPress(transaction)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surfaceMuted }]}>
      <View style={[styles.icon, { backgroundColor: isCredit ? theme.successSoft : theme.surfaceMuted }]}>
        <Icon
          name={isCredit ? "incoming" : "outgoing"}
          size={18}
          color={isCredit ? theme.success : theme.textSecondary}
        />
      </View>
      <View style={styles.text}>
        <ThemedText variant="bodyStrong" numberOfLines={1}>
          {transaction.counterparty.name}
        </ThemedText>
        <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>
          {subtitle}
        </ThemedText>
      </View>
      <ThemedText variant="bodyStrong" color={isCredit ? "success" : "text"} style={styles.amount}>
        {amountLabel}
      </ThemedText>
    </AppPressable>
  );
});
TransactionRow.displayName = "TransactionRow";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    flex: 1,
    gap: 2,
  },
  amount: {
    fontVariant: ["tabular-nums"],
  },
});
