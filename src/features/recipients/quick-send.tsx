import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Recipient } from "@/services/api/types";

import { useRecentRecipients } from "./queries";

const ITEM_WIDTH = 72;

/**
 * Horizontal strip of recently paid recipients for one-tap re-sending.
 * The API caps it at 10 items, so a plain ScrollView is cheaper than a
 * virtualised list here.
 */
export const QuickSend = ({
  onSelect,
  onNew,
}: {
  onSelect: (recipient: Recipient) => void;
  onNew: () => void;
}) => {
  const theme = useTheme();
  const { data: recipients, isError } = useRecentRecipients();

  // Hide the strip only if it failed and there is nothing cached to show.
  if (isError && !recipients) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      accessibilityLabel="Quick send">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="New transfer"
        onPress={onNew}
        style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
        <View style={[styles.newCircle, { borderColor: theme.primary, backgroundColor: theme.primarySoft }]}>
          <Icon name="add" size={24} color={theme.primary} />
        </View>
        <ThemedText variant="caption" numberOfLines={1} align="center">
          New
        </ThemedText>
      </Pressable>

      {!recipients
        ? Array.from({ length: 4 }, (_, i) => (
            <View key={i} style={styles.item}>
              <Skeleton width={52} height={52} radius={26} />
              <Skeleton width={48} height={12} />
            </View>
          ))
        : recipients.map((recipient) => (
            <Pressable
              key={recipient.id}
              accessibilityRole="button"
              accessibilityLabel={`Send to ${recipient.name}`}
              onPress={() => onSelect(recipient)}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <Avatar name={recipient.name} size={52} />
              <ThemedText variant="caption" numberOfLines={1} align="center">
                {recipient.name.split(" ")[0]}
              </ThemedText>
            </Pressable>
          ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    gap: 8,
    paddingHorizontal: 16,
  },
  item: {
    width: ITEM_WIDTH,
    alignItems: "center",
    gap: 8,
  },
  newCircle: {
    width: 52,
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: {
    opacity: 0.6,
  },
});
