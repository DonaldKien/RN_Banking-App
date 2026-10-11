import { Redirect, Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { BackHandler, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailRow } from "@/components/ui/detail-row";
import { FormScreen } from "@/components/ui/form-screen";
import { Icon } from "@/components/ui/icon";
import { Radius } from "@/constants/theme";
import { useAccount } from "@/features/account/queries";
import { PinSheet } from "@/features/auth/pin-sheet";
import { describeRecipient } from "@/features/recipients/recipient-row";
import { ProcessingOverlay } from "@/features/transfer/processing-overlay";
import { selectAmountSen, selectNote, selectRecipient } from "@/features/transfer/transfer-slice";
import { useTheme } from "@/hooks/use-theme";
import { maskAccountNumber } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { useAppSelector } from "@/store";

const ReviewTransferScreen = () => {
  const theme = useTheme();
  const recipient = useAppSelector(selectRecipient);
  const amount = useAppSelector(selectAmountSen);
  const note = useAppSelector(selectNote);
  const { data: account } = useAccount();
  const [pinVisible, setPinVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Block Android back while the transfer is in flight.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => submitting);
    return () => subscription.remove();
  }, [submitting]);

  // e.g. opened via a deep link without a draft.
  if (!recipient || amount === null) return <Redirect href="/transfer" />;

  const confirmWithPin = async (pin: string) => {
    if (pin !== "123456") throw new Error("Incorrect PIN");
    setPinVisible(false);
    setSubmitting(true);
    setTimeout(() => router.replace("/transfer/success"), 1500);
  };

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ gestureEnabled: !submitting, headerBackVisible: !submitting }} />

      <FormScreen footer={<Button title="Confirm" icon="lock" onPress={() => setPinVisible(true)} />}>
        <View style={styles.hero}>
          <Avatar name={recipient.name} size={64} />
          <ThemedText variant="caption" color="textSecondary">
            {"You're sending"}
          </ThemedText>
          <ThemedText variant="display" accessibilityLabel={`Amount ${formatMoney(amount)}`}>
            {formatMoney(amount)}
          </ThemedText>
          <ThemedText variant="body" align="center">
            to <ThemedText variant="bodyStrong">{recipient.name}</ThemedText>
          </ThemedText>
        </View>

        <Card>
          <DetailRow
            label="From"
            value={account?.productName ?? "Savings"}
            secondary={account ? maskAccountNumber(account.accountNumber) : undefined}
          />
          <DetailRow label="To" value={recipient.name} secondary={describeRecipient(recipient)} />
          <DetailRow label="Amount" value={formatMoney(amount)} />
          <DetailRow label="Fee" value="Free" valueColor="success" />
          {note.trim() !== "" && <DetailRow label="Note" value={note.trim()} />}
          {account && (
            <DetailRow label="Balance after" value={formatMoney(account.balance - amount)} valueColor="textSecondary" />
          )}
        </Card>

        <View style={[styles.security, { backgroundColor: theme.surfaceMuted }]}>
          <Icon name="shield" size={18} color={theme.primary} />
          <ThemedText variant="caption" color="textSecondary" style={styles.flex}>
            {"You'll approve this transfer before any money is sent."}
          </ThemedText>
        </View>
      </FormScreen>

      {submitting && <ProcessingOverlay message={`Sending ${formatMoney(amount)} to ${recipient.name.split(" ")[0]}…`} />}

      <PinSheet
        visible={pinVisible}
        reason="Enter your 6-digit transaction PIN to approve this transfer."
        onSubmit={confirmWithPin}
        onCancel={() => setPinVisible(false)}
      />
    </View>
  );
};

export default ReviewTransferScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  hero: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 16,
  },
  security: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: Radius.lg,
  },
});
