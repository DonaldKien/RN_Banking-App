import { useLocalSearchParams } from "expo-router";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailRow } from "@/components/ui/detail-row";
import { EmptyState } from "@/components/ui/empty-state";
import { FormScreen } from "@/components/ui/form-screen";
import { Icon } from "@/components/ui/icon";
import { Radius } from "@/constants/theme";
import { SAMPLE_TRANSACTIONS } from "@/constants/sample-data";
import { describeRecipient } from "@/features/recipients/recipient-row";
import { useTheme } from "@/hooks/use-theme";
import { formatDate, formatTime } from "@/lib/format";
import { formatMoney } from "@/lib/money";

const TransactionDetailScreen = () => {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const transaction = SAMPLE_TRANSACTIONS.find((item) => item.id === id);

  if (!transaction) {
    return <EmptyState icon="receipt" title="Transaction not found" />;
  }

  const isCredit = transaction.direction === "credit";

  return (
    <FormScreen
      footer={
        isCredit ? undefined : (
          <Button title="Send again" icon="retry" onPress={() => {}} accessibilityHint="Opens a pre-filled transfer" />
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
