import { router, useLocalSearchParams } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailRow } from "@/components/ui/detail-row";
import { FormScreen } from "@/components/ui/form-screen";
import { Icon } from "@/components/ui/icon";
import { Radius } from "@/constants/theme";
import { describeRecipient } from "@/features/recipients/recipient-row";
import { useTransaction } from "@/features/transactions/queries";
import { draftStarted } from "@/features/transfer/transfer-slice";
import { useTheme } from "@/hooks/use-theme";
import { formatDate, formatTime } from "@/lib/format";
import { formatMoney, senToAmountText } from "@/lib/money";
import { useAppDispatch } from "@/store";

const TransactionDetailScreen = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: transaction, isError, refetch } = useTransaction(id);

  if (!transaction && !isError) {
    return <ActivityIndicator style={styles.loader} color={theme.primary} />;
  }
  if (!transaction) {
    return (
      <View style={styles.padded}>
        <Banner
          tone="danger"
          title="Couldn't load this transaction"
          message="It may have been removed, or you're offline."
          actionLabel="Try again"
          onAction={() => void refetch()}
        />
      </View>
    );
  }

  const isCredit = transaction.direction === "credit";

  const sendAgain = () => {
    dispatch(
      draftStarted({
        recipient: transaction.counterparty,
        amountText: senToAmountText(transaction.amount),
        note: transaction.note,
      }),
    );
    router.push("/transfer");
  };

  return (
    <FormScreen
      footer={
        isCredit ? undefined : (
          <Button title="Send again" icon="retry" onPress={sendAgain} accessibilityHint="Opens a pre-filled transfer" />
        )
      }>
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: isCredit ? theme.successSoft : theme.primarySoft }]}>
          <Icon name={isCredit ? "incoming" : "outgoing"} size={28} color={isCredit ? theme.success : theme.primary} />
        </View>
        <ThemedText variant="display" color={isCredit ? "success" : "text"}>
          {formatMoney(isCredit ? transaction.amount : -transaction.amount, { signed: true })}
        </ThemedText>
        <ThemedText variant="body" color="textSecondary" align="center">
          {isCredit ? "Received from" : "Sent to"} {transaction.counterparty.name}
        </ThemedText>
        <View style={[styles.status, { backgroundColor: theme.successSoft }]}>
          <Icon name="checkCircle" size={14} color={theme.success} />
          <ThemedText variant="captionStrong" color="success">
            Completed
          </ThemedText>
        </View>
      </View>

      <Card>
        <DetailRow
          label={isCredit ? "From" : "To"}
          value={transaction.counterparty.name}
          secondary={describeRecipient(transaction.counterparty)}
        />
        <DetailRow label="Date" value={formatDate(transaction.createdAt)} secondary={formatTime(transaction.createdAt)} />
        {transaction.note && <DetailRow label="Note" value={transaction.note} />}
        <DetailRow label="Reference" value={transaction.reference} mono />
      </Card>
    </FormScreen>
  );
};

export default TransactionDetailScreen;

const styles = StyleSheet.create({
  loader: {
    marginTop: 48,
  },
  padded: {
    padding: 16,
  },
  hero: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 24,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginTop: 8,
  },
});
