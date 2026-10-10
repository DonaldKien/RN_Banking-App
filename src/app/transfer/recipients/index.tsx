import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Tabs } from "@/components/ui/tabs";
import { TextField } from "@/components/ui/text-field";
import { Radius } from "@/constants/theme";
import { SavedRecipientsList } from "@/features/recipients/saved-recipients-list";
import { useTheme } from "@/hooks/use-theme";
import { normaliseSearchText } from "@/lib/format";

type Source = "saved" | "contacts";

const SOURCES = [
  { value: "saved", label: "Saved" },
  { value: "contacts", label: "Contacts" },
] as const;

const RecipientPickerScreen = () => {
  const theme = useTheme();
  const initialSource = SOURCES[0].value || "";
  const [source, setSource] = useState<Source>(initialSource);
  const [search, setSearch] = useState("");
  const searchQuery = normaliseSearchText(search);

  return (
    <View style={styles.flex}>
      <View style={styles.header}>
        <TextField
          placeholder={
            source === "saved"
              ? "Search name or account number"
              : "Search contacts"
          }
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          leading={<Icon name="search" size={18} color={theme.textTertiary} />}
        />
        <Tabs options={SOURCES} value={source} onChange={setSource} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pay a new account or mobile number"
          onPress={() => {}}
          style={({ pressed }) => [
            styles.newRow,
            {
              backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={[styles.newIcon, { backgroundColor: theme.primarySoft }]}
          >
            <Icon name="personAdd" size={20} color={theme.primary} />
          </View>
          <View style={styles.flex}>
            <ThemedText variant="bodyStrong">New recipient</ThemedText>
            <ThemedText variant="caption" color="textSecondary">
              Bank account or DuitNow mobile number
            </ThemedText>
          </View>
          <Icon name="chevronRight" size={16} color={theme.textTertiary} />
        </Pressable>
      </View>

      {source === "saved" ? (
        <SavedRecipientsList search={searchQuery} onSelect={() => {}} />
      ) : (
        <EmptyState icon="contacts" title="Pay your contacts" message="Send money to a contact's mobile number." />
      )}
    </View>
  );
};

export default RecipientPickerScreen;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  newRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  newIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
});
