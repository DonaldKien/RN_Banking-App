import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/ui/empty-state";
import { SAMPLE_RECIPIENTS } from "@/constants/sample-data";
import type { Recipient } from "@/services/api/types";

import { ListSectionHeader } from "./list-section-header";
import { RecipientRow } from "./recipient-row";
import { buildRecipientRows, type RecipientListRow } from "./recipient-rows";

export const SavedRecipientsList = ({
  search,
  onSelect,
}: {
  search: string;
  onSelect: (recipient: Recipient) => void;
}) => {
  const insets = useSafeAreaInsets();

  const { rows, stickyHeaderIndices } = useMemo(
    () => buildRecipientRows(SAMPLE_RECIPIENTS, SAMPLE_RECIPIENTS.slice(0, 3), search),
    [search],
  );

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
