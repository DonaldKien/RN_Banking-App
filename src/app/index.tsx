import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { MaxContentWidth } from "@/constants/theme";
import { BalanceCard } from "@/features/account/balance-card";
import { useAccount } from "@/features/account/queries";
import { selectBalanceHidden } from "@/features/preferences/preferences-slice";
import { QuickSend } from "@/features/recipients/quick-send";
import { useRecentTransactions } from "@/features/transactions/queries";
import { TransactionRow } from "@/features/transactions/transaction-row";
import { draftStarted } from "@/features/transfer/transfer-slice";
import { useTheme } from "@/hooks/use-theme";
import { greeting } from "@/lib/format";
import type { Recipient, Transaction } from "@/services/api/types";
import { useAppDispatch, useAppSelector } from "@/store";

const HomeScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: account } = useAccount();
  const recent = useRecentTransactions(5);
  const balanceHidden = useAppSelector(selectBalanceHidden);

  const startTransfer = (recipient?: Recipient) => {
    dispatch(draftStarted({ recipient }));
    router.push("/transfer");
  };

  const openTransaction = (transaction: Transaction) => {
    router.push({ pathname: "/transaction/[id]", params: { id: transaction.id } });
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ type: "active" });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.primary} />}>
      <View style={styles.inner}>
        <View style={[styles.header, styles.padded]}>
          <View style={styles.greeting}>
            <Avatar name={account?.holderName ?? "?"} size={40} />
            <View>
              <ThemedText variant="caption" color="textSecondary">
                {greeting()}
              </ThemedText>
              <ThemedText variant="heading">{account?.holderName ?? " "}</ThemedText>
            </View>
          </View>
          <IconButton icon="tune" label="Demo controls" onPress={() => router.push("/demo-settings")} />
        </View>

        <View style={styles.padded}>
          <BalanceCard />
        </View>

        <View style={[styles.actions, styles.padded]}>
          <Button
            testID="start-transfer"
            title="Transfer"
            icon="send"
            onPress={() => startTransfer()}
            style={styles.flex}
          />
          <Button
            title="History"
            icon="history"
            variant="secondary"
            onPress={() => router.push("/history")}
            style={styles.flex}
          />
        </View>

        <View style={styles.section}>
          <ThemedText variant="heading" style={styles.padded}>
            Quick send
          </ThemedText>
          <QuickSend onSelect={startTransfer} onNew={() => startTransfer()} />
        </View>

        <View style={[styles.section, styles.padded]}>
          <View style={styles.sectionHeader}>
            <ThemedText variant="heading">Recent activity</ThemedText>
            <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.push("/history")}>
              <ThemedText variant="captionStrong" color="primary">
                See all
              </ThemedText>
            </Pressable>
          </View>

          {/* Show the error only when there is nothing cached to display. */}
          {recent.isError && !recent.data ? (
            <Banner
              tone="danger"
              title="Couldn't load activity"
              message="Check your connection and try again."
              actionLabel="Try again"
              onAction={() => void recent.refetch()}
            />
          ) : (
            <Card style={styles.listCard}>
              {!recent.data ? (
                Array.from({ length: 4 }, (_, i) => (
                  <View key={i} style={styles.skeletonRow}>
                    <Skeleton width={40} height={40} radius={20} />
                    <View style={styles.flex}>
                      <Skeleton width="60%" height={14} />
                      <Skeleton width="35%" height={12} style={styles.skeletonGap} />
                    </View>
                  </View>
                ))
              ) : recent.data.length === 0 ? (
                <EmptyState icon="receipt" title="No transactions yet" message="Your transfers will show up here." />
              ) : (
                recent.data.map((transaction) => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    onPress={openTransaction}
                    hideAmount={balanceHidden}
                  />
                ))
              )}
            </Card>
          )}
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listCard: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    overflow: "hidden",
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  skeletonGap: {
    marginTop: 8,
  },
});
