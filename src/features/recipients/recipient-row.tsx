import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { AppPressable } from "@/components/ui/app-pressable";
import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/hooks/use-theme";
import { formatPhone, maskAccountNumber } from "@/lib/format";
import type { Recipient } from "@/services/api/types";

export const describeRecipient = (recipient: Recipient): string => {
  return recipient.type === "DUITNOW_MOBILE"
    ? `${recipient.bankName} · ${formatPhone(recipient.accountId)}`
    : `${recipient.bankName} · ${maskAccountNumber(recipient.accountId)}`;
};

/**
 * List row for a recipient. Memoised and given a stable `onSelect(recipient)`
 * signature so FlashList can recycle rows without re-rendering unchanged ones.
 */
export const RecipientRow = memo(({
  recipient,
  onSelect,
  subtitle,
  disabled = false,
}: {
  recipient: Recipient;
  onSelect: (recipient: Recipient) => void;
  subtitle?: string;
  disabled?: boolean;
}) => {
  const theme = useTheme();
  const detail = subtitle ?? describeRecipient(recipient);

  return (
    <AppPressable
      accessibilityRole="button"
      accessibilityLabel={`${recipient.name}, ${detail}`}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => onSelect(recipient)}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.surfaceMuted }, disabled && styles.disabled]}>
      <Avatar name={recipient.name} />
      <View style={styles.text}>
        <View style={styles.titleRow}>
          <ThemedText variant="bodyStrong" numberOfLines={1} style={styles.name}>
            {recipient.name}
          </ThemedText>
          {recipient.isFavourite && <Icon name="star" size={14} color={theme.warning} />}
        </View>
        <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>
          {detail}
        </ThemedText>
      </View>
      {!disabled && <Icon name="chevronRight" size={16} color={theme.textTertiary} />}
    </AppPressable>
  );
});
RecipientRow.displayName = "RecipientRow";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  name: {
    flexShrink: 1,
  },
  disabled: {
    opacity: 0.5,
  },
});
