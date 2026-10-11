import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Banner } from "@/components/ui/banner";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { selectBalanceHidden } from "@/features/preferences/preferences-slice";
import { ListSectionHeader } from "@/features/recipients/list-section-header";
import { groupTransactionsByDay, type HistoryRow } from "@/features/transactions/group-by-day";
import { useTransactions } from "@/features/transactions/queries";
import { TransactionRow } from "@/features/transactions/transaction-row";
import { useTheme } from "@/hooks/use-theme";
import type { Transaction, TransactionFilter } from "@/services/api/types";
import { useAppSelector } from "@/store";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "debit", label: "Sent" },
  { value: "credit", label: "Received" },
] as const;

const openTransaction = (transaction: Transaction) => {
  router.push({ pathname: "/transaction/[id]", params: { id: transaction.id } });
};

const HistoryScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const balanceHidden = useAppSelector(selectBalanceHidden);

  const { data, isPending, isError, refetch, isRefetching, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useTransactions(filter);

  const { rows, stickyHeaderIndices } = useMemo(
    () => groupTransactionsByDay(data?.pages.flatMap((page) => page.items) ?? []),
    [data],
  );

  const renderItem: ListRenderItem<HistoryRow> = ({ item }) =>
    item.type === "header" ? (
      <ListSectionHeader label={item.label} />
    ) : (
      <TransactionRow transaction={item.transaction} onPress={openTransaction} hideAmount={balanceHidden} />
    );

  return (
    <View style={styles.flex}>
      <View style={styles.filters}>
        <Tabs options={FILTERS} value={filter} onChange={setFilter} />
      </View>

      {isError && !data ? (
        <View style={styles.padded}>
          <Banner
            tone="danger"
            title="Couldn't load transactions"
            message="Check your connection and try again."
            actionLabel="Try again"
            onAction={() => void refetch()}
          />
        </View>
      ) : isPending ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : (
        <FlashList
          data={rows}
          renderItem={renderItem}
          keyExtractor={(row) => row.key}
          getItemType={(row) => row.type}
          stickyHeaderIndices={stickyHeaderIndices}
          extraData={balanceHidden}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          refreshing={isRefetching && !isFetchingNextPage}
          onRefresh={() => void refetch()}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          ListEmptyComponent={<EmptyState icon="receipt" title="No transactions" message="Nothing to show for this filter." />}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator style={styles.footer} color={theme.primary} />
            ) : !hasNextPage && rows.length > 0 ? (
              <ThemedText variant="caption" color="textTertiary" align="center" style={styles.footer}>
                {"You've reached the beginning of your history"}
              </ThemedText>
            ) : null
          }
        />
      )}
    </View>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  filters: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  padded: {
    padding: 16,
  },
  loader: {
    marginTop: 48,
  },
  footer: {
    paddingVertical: 24,
  },
});
