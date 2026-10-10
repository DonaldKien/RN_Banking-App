import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { MaxContentWidth } from "@/constants/theme";
import { SAMPLE_ACCOUNT, SAMPLE_TRANSACTIONS } from "@/constants/sample-data";
import { BalanceCard } from "@/features/account/balance-card";
import { QuickSend } from "@/features/recipients/quick-send";
import { TransactionRow } from "@/features/transactions/transaction-row";
import { useTheme } from "@/hooks/use-theme";
import { greeting } from "@/lib/format";

const HomeScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const startTransfer = () => {
    router.push("/transfer");
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
      <View style={styles.inner}>
        <View style={[styles.header, styles.padded]}>
          <View style={styles.greeting}>
            <Avatar name={SAMPLE_ACCOUNT.holderName} size={40} />
            <View>
              <ThemedText variant="caption" color="textSecondary">
                {greeting()}
              </ThemedText>
              <ThemedText variant="heading">{SAMPLE_ACCOUNT.holderName}</ThemedText>
            </View>
          </View>
          <IconButton icon="tune" label="Demo controls" onPress={() => {}} />
        </View>

        <View style={styles.padded}>
          <BalanceCard />
        </View>

        <View style={[styles.actions, styles.padded]}>
          <Button testID="start-transfer" title="Transfer" icon="send" onPress={startTransfer} style={styles.flex} />
          <Button title="History" icon="history" variant="secondary" onPress={() => {}} style={styles.flex} />
        </View>

        <View style={styles.section}>
          <ThemedText variant="heading" style={styles.padded}>
            Quick send
          </ThemedText>
          <QuickSend onSelect={startTransfer} onNew={startTransfer} />
        </View>

        <View style={[styles.section, styles.padded]}>
          <ThemedText variant="heading">Recent activity</ThemedText>
          <Card style={styles.listCard}>
            {SAMPLE_TRANSACTIONS.slice(0, 5).map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} onPress={() => {}} />
            ))}
          </Card>
        </View>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  content: {
    paddingBottom: 48,
    alignItems: "center",
  },
  inner: {
    width: "100%",
    maxWidth: MaxContentWidth,
    gap: 24,
  },
  padded: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  section: {
    gap: 12,
  },
  listCard: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    overflow: "hidden",
  },
});
