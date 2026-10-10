import { FlashList } from "@shopify/flash-list";
import { useMemo } from "react";
import { ActivityIndicator, Linking, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useTheme } from "@/hooks/use-theme";
import { formatPhone, normaliseSearchText } from "@/lib/format";
import type { Recipient } from "@/services/api/types";

import {
  useContactsAccess,
  useDeviceContacts,
  useRequestContactsAccess,
  type DeviceContactEntry,
} from "./device-contacts";
import { RecipientRow } from "./recipient-row";

/**
 * Lets users pay someone from their address book via DuitNow. Handles every
 * permission state explicitly, including "denied permanently" (deep-links to
 * Settings) and iOS 18 limited access.
 */
export const ContactsList = ({
  search,
  onSelect,
}: {
  search: string;
  onSelect: (recipient: Recipient) => void;
}) => {
  const theme = useTheme();
  const access = useContactsAccess();
  const requestAccess = useRequestContactsAccess();
  const granted = access.data?.status === "granted";
  const contacts = useDeviceContacts(granted);

  if (access.isPending) {
    return <ActivityIndicator style={styles.loader} color={theme.primary} />;
  }

  const status = access.data?.status ?? "unavailable";

  if (status === "unavailable") {
    return (
      <EmptyState
        icon="contacts"
        title="Contacts aren't available here"
        message="Open the app on your phone to pay someone from your contacts."
      />
    );
  }

  if (status === "undetermined" || (access.data?.status === "denied" && access.data.canAskAgain)) {
    return (
      <EmptyState
        icon="contacts"
        title="Pay your contacts"
        message="Allow access to send money to a contact's mobile number via DuitNow. We only read names and phone numbers, and nothing is shared until you pick a recipient.">
        <Button
          title="Allow access"
          onPress={() => requestAccess.mutate()}
          loading={requestAccess.isPending}
          style={styles.cta}
        />
      </EmptyState>
    );
  }

  if (status === "denied") {
    return (
      <EmptyState
        icon="lock"
        title="Contacts access is off"
        message="Turn on contacts access for this app in Settings to pay your contacts.">
        <Button title="Open Settings" variant="secondary" onPress={() => void Linking.openSettings()} style={styles.cta} />
      </EmptyState>
    );
  }

  return (
    <GrantedContactsList
      entries={contacts.data}
      loading={contacts.isPending}
      failed={contacts.isError && !contacts.data}
      onRetry={() => void contacts.refetch()}
      limited={access.data?.status === "granted" && access.data.limited}
      search={search}
      onSelect={onSelect}
    />
  );
};

const GrantedContactsList = ({
  entries,
  loading,
  failed,
  onRetry,
  limited,
  search,
  onSelect,
}: {
  entries: DeviceContactEntry[] | undefined;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
  limited: boolean;
  search: string;
  onSelect: (recipient: Recipient) => void;
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const filtered = useMemo(() => {
    if (!entries) return [];
    if (!search) return entries;
    const digits = search.replace(/\D/g, "");
    return entries.filter(
      (entry) =>
        normaliseSearchText(entry.name).includes(search) ||
        (digits.length >= 3 && entry.rawPhone.replace(/\D/g, "").includes(digits)),
    );
  }, [entries, search]);

  if (loading) return <ActivityIndicator style={styles.loader} color={theme.primary} />;
  if (failed) {
    return (
      <View style={styles.padded}>
        <Banner
          tone="danger"
          title="Couldn't read your contacts"
          message="Please try again."
          actionLabel="Try again"
          onAction={onRetry}
        />
      </View>
    );
  }

  return (
    <FlashList
      data={filtered}
      keyExtractor={(entry) => entry.key}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      ListHeaderComponent={
        limited ? (
          <View style={styles.padded}>
            <Banner
              tone="info"
              message="You've shared only some contacts with this app. You can change this in Settings."
              actionLabel="Open Settings"
              onAction={() => void Linking.openSettings()}
            />
          </View>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          icon="contacts"
          title={search ? "No matches" : "No contacts with phone numbers"}
          message={search ? "Try a different name or number." : undefined}
        />
      }
      renderItem={({ item }) =>
        item.recipient ? (
          <RecipientRow
            recipient={item.recipient}
            onSelect={onSelect}
            subtitle={`${item.phoneLabel} · ${formatPhone(item.recipient.accountId)}`}
          />
        ) : (
          <RecipientRow
            recipient={{ id: item.key, name: item.name, type: "DUITNOW_MOBILE", accountId: item.rawPhone, bankName: "" }}
            onSelect={onSelect}
            subtitle={`${item.rawPhone} · Not a Malaysian mobile number`}
            disabled
          />
        )
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
  cta: {
    alignSelf: "stretch",
    marginTop: 8,
  },
});
