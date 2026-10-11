import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { SAMPLE_TRANSACTIONS } from "@/constants/sample-data";
import { selectBalanceHidden } from "@/features/preferences/preferences-slice";
import { ListSectionHeader } from "@/features/recipients/list-section-header";
import { groupTransactionsByDay, type HistoryRow } from "@/features/transactions/group-by-day";
import { TransactionRow } from "@/features/transactions/transaction-row";
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

/** Full transaction history, virtualised with FlashList, with sticky day headers. */
const HistoryScreen = () => {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<TransactionFilter>("all");
  const balanceHidden = useAppSelector(selectBalanceHidden);

  const { rows, stickyHeaderIndices } = useMemo(
    () =>
      groupTransactionsByDay(
        SAMPLE_TRANSACTIONS.filter((transaction) => filter === "all" || transaction.direction === filter),
      ),
    [filter],
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

      <FlashList
        data={rows}
        renderItem={renderItem}
        keyExtractor={(row) => row.key}
        getItemType={(row) => row.type}
        stickyHeaderIndices={stickyHeaderIndices}
        extraData={balanceHidden}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListEmptyComponent={<EmptyState icon="receipt" title="No transactions" message="Nothing to show for this filter." />}
      />
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
});
