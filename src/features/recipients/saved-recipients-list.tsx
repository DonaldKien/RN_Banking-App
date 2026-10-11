import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Banner } from "@/components/ui/banner";
import { EmptyState } from "@/components/ui/empty-state";
import { useTheme } from "@/hooks/use-theme";
import type { Recipient } from "@/services/api/types";

import { ListSectionHeader } from "./list-section-header";
import { useRecentRecipients, useSavedRecipients } from "./queries";
import { RecipientRow } from "./recipient-row";
import { buildRecipientRows, type RecipientListRow } from "./recipient-rows";

export const SavedRecipientsList = ({
  search,
  onSelect,
}: {
  search: string;
  onSelect: (recipient: Recipient) => void;
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const saved = useSavedRecipients();
  const recent = useRecentRecipients();

  const { rows, stickyHeaderIndices } = useMemo(
    () => buildRecipientRows(saved.data ?? [], recent.data ?? [], search),
    [saved.data, recent.data, search],
  );

  if (saved.isPending) {
    return <ActivityIndicator style={styles.loader} color={theme.primary} />;
  }
  if (!saved.data) {
    return (
      <View style={styles.padded}>
        <Banner
          tone="danger"
          title="Couldn't load your recipients"
          message="Check your connection and try again."
          actionLabel="Try again"
          onAction={() => void saved.refetch()}
        />
      </View>
    );
  }

  const renderItem: ListRenderItem<RecipientListRow> = ({ item }) =>
    item.type === "header" ? (
      <ListSectionHeader label={item.label} />
    ) : (
      <RecipientRow recipient={item.recipient} onSelect={onSelect} />
    );

  return (
    <FlashList
      data={rows}
      renderItem={renderItem}
      keyExtractor={(row) => row.key}
      getItemType={(row) => row.type}
      stickyHeaderIndices={stickyHeaderIndices}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      ListEmptyComponent={
        <EmptyState
          icon="search"
          title="No matches"
          message="Try a different name or number, or add a new recipient."
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  loader: {
    marginTop: 32,
  },
  padded: {
    padding: 16,
  },
});
