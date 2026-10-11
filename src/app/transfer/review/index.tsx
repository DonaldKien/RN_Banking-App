import { Redirect, Stack, router } from "expo-router";
import { useEffect } from "react";
import { BackHandler, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Banner } from "@/components/ui/banner";
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
import { useConfirmTransfer } from "@/features/transfer/use-confirm-transfer";
import { useTheme } from "@/hooks/use-theme";
import { maskAccountNumber } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { useAppSelector } from "@/store";

/** Step 2: confirm details, authenticate, submit. */
const ReviewTransferScreen = () => {
  const theme = useTheme();
  const recipient = useAppSelector(selectRecipient);
  const amount = useAppSelector(selectAmountSen);
  const note = useAppSelector(selectNote);
  const { data: account } = useAccount();

  const flow = useConfirmTransfer({
    onSuccess: (receipt) =>
      router.replace({ pathname: "/transfer/success", params: { id: receipt.transaction.id } }),
  });

  // Block Android hardware back while authenticating or submitting.
  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => flow.busy);
    return () => subscription.remove();
  }, [flow.busy]);

  // Reached without a complete draft (e.g. via deep link): restart the flow.
  if (!recipient || amount === null) return <Redirect href="/transfer" />;

  const { phase, capability } = flow;

  const confirmLabel = capability ? `Confirm with ${capability.label}` : "Confirm";

  return (
    <View style={styles.flex}>
      <Stack.Screen options={{ gestureEnabled: !flow.busy, headerBackVisible: !flow.busy }} />

      <FormScreen
        footer={
          <View style={styles.footer}>
            <Button
              testID="confirm-transfer"
              title={phase.name === "authenticating" ? `Waiting for ${capability?.label ?? "approval"}…` : confirmLabel}
              icon={capability?.icon ?? "lock"}
              onPress={() => void flow.confirm()}
              loading={flow.capabilityLoading}
              disabled={flow.busy}
              accessibilityHint={`Sends ${formatMoney(amount)} to ${recipient.name}`}
            />
            {capability && capability.method !== "pin" && (
              <Button title="Use PIN instead" variant="ghost" size="sm" onPress={flow.switchToPin} disabled={flow.busy} />
            )}
          </View>
        }>
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

        {flow.notice && phase.name === "idle" && <Banner tone="warning" message={flow.notice} />}

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

        {capability && (
          <View style={[styles.security, { backgroundColor: theme.surfaceMuted }]}>
            <Icon name="shield" size={18} color={theme.primary} />
            <ThemedText variant="caption" color="textSecondary" style={styles.flex}>
              {capability.method === "pin"
                ? "You'll approve this transfer with your transaction PIN."
                : `You'll approve this transfer with ${capability.label}. Your biometric data never leaves your device.`}
            </ThemedText>
          </View>
        )}
      </FormScreen>

      {phase.name === "submitting" && (
        <ProcessingOverlay message={`Sending ${formatMoney(amount)} to ${recipient.name.split(" ")[0]}…`} />
      )}

      <PinSheet
        visible={phase.name === "pin"}
        reason={phase.name === "pin" ? phase.reason : ""}
        onSubmit={flow.confirmWithPin}
        onCancel={flow.dismissPin}
      />
    </View>
  );
};

export default ReviewTransferScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  footer: {
    gap: 4,
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
