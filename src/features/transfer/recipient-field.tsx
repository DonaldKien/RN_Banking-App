import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { Radius } from "@/constants/theme";
import { describeRecipient } from "@/features/recipients/recipient-row";
import { useTheme } from "@/hooks/use-theme";
import type { Recipient } from "@/services/api/types";

/** Tappable summary of the chosen recipient; opens the recipient picker. */
export const RecipientField = ({
  recipient,
  onPress,
  error,
}: {
  recipient: Recipient | null;
  onPress: () => void;
  error?: string;
}) => {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText variant="captionStrong" color="textSecondary">
        To
      </ThemedText>
      <Pressable
        testID="recipient-field"
        accessibilityRole="button"
        accessibilityLabel={recipient ? `Recipient ${recipient.name}. Change recipient` : "Choose recipient"}
        accessibilityHint={error}
        onPress={onPress}
        style={({ pressed }) => [
          styles.field,
          {
            backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
            borderColor: error ? theme.danger : theme.border,
          },
        ]}>
        {recipient ? (
          <>
            <Avatar name={recipient.name} />
            <View style={styles.text}>
              <ThemedText variant="bodyStrong" numberOfLines={1}>
                {recipient.name}
              </ThemedText>
              <ThemedText variant="caption" color="textSecondary" numberOfLines={1}>
                {describeRecipient(recipient)}
              </ThemedText>
            </View>
            <ThemedText variant="captionStrong" color="primary">
              Change
            </ThemedText>
          </>
        ) : (
          <>
            <View style={[styles.placeholderIcon, { backgroundColor: theme.primarySoft }]}>
              <Icon name="person" size={20} color={theme.primary} />
            </View>
            <View style={styles.text}>
              <ThemedText variant="bodyStrong">Choose recipient</ThemedText>
              <ThemedText variant="caption" color="textSecondary">
                Saved, contacts or a new account
              </ThemedText>
            </View>
            <Icon name="chevronRight" size={16} color={theme.textTertiary} />
          </>
        )}
      </Pressable>
      {error && (
        <ThemedText variant="caption" color="danger">
          {error}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  placeholderIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
