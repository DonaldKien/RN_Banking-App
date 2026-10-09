import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { IconButton } from "@/components/ui/icon-button";
import { Radius } from "@/constants/theme";
import { SAMPLE_ACCOUNT } from "@/constants/sample-data";
import { useTheme } from "@/hooks/use-theme";
import { maskAccountNumber } from "@/lib/format";
import { formatMoney } from "@/lib/money";

const HIDDEN_AMOUNT = "RM ••••••";

export const BalanceCard = () => {
  const theme = useTheme();
  const [hidden, setHidden] = useState(false);
  const account = SAMPLE_ACCOUNT;

  const onPrimary = { color: theme.onPrimary };
  const muted = { color: theme.onPrimary, opacity: 0.75 };

  return (
    <View style={[styles.card, { backgroundColor: theme.primary }]}>
      {/* Decorative shapes */}
      <View style={[styles.blob, styles.blobLarge]} />
      <View style={[styles.blob, styles.blobSmall]} />

      <View style={styles.header}>
        <ThemedText variant="caption" style={muted}>
          Available balance
        </ThemedText>
        <IconButton
          icon={hidden ? "eye" : "eyeOff"}
          label={hidden ? "Show balance" : "Hide balance"}
          tone="onPrimary"
          onPress={() => setHidden((value) => !value)}
        />
      </View>

      <View style={styles.amount}>
        <ThemedText
          variant="display"
          style={onPrimary}
          accessibilityLabel={hidden ? "Balance hidden" : `Balance ${formatMoney(account.balance)}`}>
          {hidden ? HIDDEN_AMOUNT : formatMoney(account.balance)}
        </ThemedText>
        <ThemedText variant="caption" style={muted}>
          {account.productName} · {maskAccountNumber(account.accountNumber)}
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: 24,
    gap: 8,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  amount: {
    gap: 8,
    minHeight: 72,
  },
  blob: {
    position: "absolute",
    borderRadius: Radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  blobLarge: {
    width: 220,
    height: 220,
    right: -70,
    top: -90,
  },
  blobSmall: {
    width: 120,
    height: 120,
    right: 40,
    bottom: -70,
  },
});
