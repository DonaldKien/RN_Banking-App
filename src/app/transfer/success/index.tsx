import { router } from "expo-router";
import { useEffect } from "react";
import { BackHandler, ScrollView, Share, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailRow } from "@/components/ui/detail-row";
import { Icon } from "@/components/ui/icon";
import { MaxContentWidth, Radius } from "@/constants/theme";
import { SAMPLE_TRANSACTIONS } from "@/constants/sample-data";
import { useBalance } from "@/features/account/queries";
import { selectBalanceHidden } from "@/features/preferences/preferences-slice";
import { describeRecipient } from "@/features/recipients/recipient-row";
import { draftCleared, draftStarted } from "@/features/transfer/transfer-slice";
import { useTheme } from "@/hooks/use-theme";
import { formatDateTime } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { useAppDispatch, useAppSelector } from "@/store";

const goHome = () => {
  router.dismissTo("/");
};

/** Step 3: receipt. */
const TransferSuccessScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const transaction = SAMPLE_TRANSACTIONS[0];
  const { data: balance } = useBalance();
  const dispatch = useAppDispatch();
  const balanceHidden = useAppSelector(selectBalanceHidden);

  // The draft has been sent.
  useEffect(() => {
    dispatch(draftCleared());
  }, [dispatch]);

  // Android back from a receipt returns home rather than to the spent form.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      goHome();
      return true;
    });
    return () => subscription.remove();
  }, []);

  const share = () => {
    const lines = [
      "Transfer successful",
      `Amount: ${formatMoney(transaction.amount)}`,
      `To: ${transaction.counterparty.name} (${describeRecipient(transaction.counterparty)})`,
      `Date: ${formatDateTime(transaction.createdAt)}`,
      `Reference: ${transaction.reference}`,
      transaction.note ? `Note: ${transaction.note}` : null,
    ];
    void Share.share({ message: lines.filter(Boolean).join("\n") });
  };

  const anotherTransfer = () => {
    dispatch(draftStarted());
    router.dismissTo("/transfer");
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 },
      ]}>
      <View style={styles.inner}>
        <View style={styles.hero}>
          <Animated.View
            entering={ZoomIn.springify().damping(12).delay(100)}
            style={[styles.checkCircle, { backgroundColor: theme.successSoft }]}>
            <Icon name="checkCircle" size={56} color={theme.success} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(250)} style={styles.heroText}>
            <ThemedText variant="title" align="center" accessibilityRole="header">
              Transfer successful
            </ThemedText>
            <ThemedText variant="display" align="center">
              {formatMoney(transaction.amount)}
            </ThemedText>
            <ThemedText variant="body" color="textSecondary" align="center">
              sent to {transaction.counterparty.name}
            </ThemedText>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(400)}>
          <Card>
            <DetailRow
              label="To"
              value={transaction.counterparty.name}
              secondary={describeRecipient(transaction.counterparty)}
            />
            <DetailRow label="Date & time" value={formatDateTime(transaction.createdAt)} />
            {transaction.note && <DetailRow label="Note" value={transaction.note} />}
            <DetailRow label="Reference" value={transaction.reference} mono />
            {balance !== undefined && (
              <DetailRow
                label="Available balance"
                value={balanceHidden ? "RM ••••••" : formatMoney(balance)}
                valueColor="textSecondary"
              />
            )}
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)} style={styles.actions}>
          <Button testID="done" title="Done" onPress={goHome} />
          <Button title="Share receipt" icon="share" variant="secondary" onPress={share} />
          <Button title="Make another transfer" variant="ghost" onPress={anotherTransfer} />
        </Animated.View>
      </View>
    </ScrollView>
  );
};

export default TransferSuccessScreen;

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    alignItems: "center",
  },
  inner: {
    width: "100%",
    maxWidth: MaxContentWidth,
    gap: 24,
  },
  hero: {
    alignItems: "center",
    gap: 16,
  },
  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: {
    gap: 4,
    alignItems: "center",
  },
  actions: {
    gap: 8,
  },
});
