import { FlashList } from "@shopify/flash-list";
import { useMemo, useState } from "react";
import { Modal, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppPressable } from "@/components/ui/app-pressable";
import { ThemedText } from "@/components/themed-text";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon, type IconName } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";
import { TextField } from "@/components/ui/text-field";
import { DEBOUNCE_MS } from "@/constants/debounce";
import { Radius } from "@/constants/theme";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useTheme } from "@/hooks/use-theme";
import { normaliseSearchText } from "@/lib/format";
import { haptics as hapticFeedback } from "@/lib/haptics";

export interface DropdownOption<T extends string> {
  value: T;
  label: string;
  /** Optional second line, also searchable (e.g. a bank's full legal name). */
  description?: string;
}

export interface SearchableDropdownProps<T extends string> {
  /** Shown above the field and as the sheet's title. */
  label: string;
  options: readonly DropdownOption<T>[];
  /** The selected option's value; empty or `null` when nothing is selected. */
  value: string | null | undefined;
  onChange: (value: T) => void;
  /** Called when the sheet closes, so form libraries can mark the field as touched. */
  onBlur?: () => void;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Shown when the search matches nothing. */
  emptyMessage?: string;
  error?: string;
  helper?: string;
  /** Icon shown at the start of the field, e.g. "bank". */
  icon?: IconName;
  /** Play a light "tick" when an option is chosen. Defaults to `true`. */
  haptics?: boolean;
  testID?: string;
}

/** Does the option's label or description contain the (already normalised) query? */
const matchesQuery = <T extends string>(option: DropdownOption<T>, query: string): boolean => {
  if (!query) return true;
  if (normaliseSearchText(option.label).includes(query)) return true;
  return option.description !== undefined && normaliseSearchText(option.description).includes(query);
};

/**
 * A field that opens a searchable list of options in a sheet, the mobile
 * version of a searchable dropdown. Use it when the list is too long for
 * chips or tabs (banks, countries, ...).
 *
 * @example
 * <SearchableDropdown
 *   label="Bank"
 *   options={[{ value: "MBB", label: "Maybank", description: "Malayan Banking Berhad" }]}
 *   value={bankCode}
 *   onChange={setBankCode}
 * />
 */
export const SearchableDropdown = <T extends string>({
  label,
  options,
  value,
  onChange,
  onBlur,
  placeholder = "Select",
  searchPlaceholder = "Search",
  emptyMessage = "Try a different search.",
  error,
  helper,
  icon,
  haptics = true,
  testID,
}: SearchableDropdownProps<T>) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filter only once typing pauses, like every other search box.
  const query = useDebouncedValue(normaliseSearchText(search), DEBOUNCE_MS.search);
  const filteredOptions = useMemo(() => options.filter((option) => matchesQuery(option, query)), [options, query]);

  const selectedOption = options.find((option) => option.value === value);

  const open = () => setIsOpen(true);

  const close = () => {
    setIsOpen(false);
    setSearch("");
    onBlur?.();
  };

  const select = (option: DropdownOption<T>) => {
    if (haptics) hapticFeedback.selection();
    onChange(option.value);
    close();
  };

  return (
    <View style={styles.container}>
      <ThemedText variant="captionStrong" color="textSecondary">
        {label}
      </ThemedText>

      {/* The closed field */}
      <AppPressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selectedOption ? selectedOption.label : placeholder}`}
        accessibilityHint={error ?? `Opens a searchable list of ${label.toLowerCase()} options`}
        onPress={open}
        style={({ pressed }) => [
          styles.field,
          {
            backgroundColor: pressed ? theme.surfaceMuted : theme.surface,
            borderColor: error ? theme.danger : isOpen ? theme.primary : theme.border,
          },
        ]}>
        {icon && <Icon name={icon} size={18} color={theme.textTertiary} />}
        <ThemedText
          variant="body"
          color={selectedOption ? "text" : "textTertiary"}
          numberOfLines={1}
          style={styles.fieldText}>
          {selectedOption ? selectedOption.label : placeholder}
        </ThemedText>
        <Icon name="chevronDown" size={18} color={theme.textSecondary} />
      </AppPressable>

      {(error || helper) && (
        <ThemedText variant="caption" color={error ? "danger" : "textSecondary"}>
          {error ?? helper}
        </ThemedText>
      )}

      {/* The sheet with search + options */}
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}
        onRequestClose={close}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.background,
              paddingTop: 16,
            },
          ]}>
          <View style={styles.sheetHeader}>
            <ThemedText variant="heading" accessibilityRole="header">
              {label}
            </ThemedText>
            <IconButton icon="close" label="Close" onPress={close} />
          </View>

          <View style={styles.searchBox}>
            <TextField
              placeholder={searchPlaceholder}
              value={search}
              onChangeText={setSearch}
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
              clearButtonMode="while-editing"
              leading={<Icon name="search" size={18} color={theme.textTertiary} />}
            />
          </View>

          <FlashList
            data={filteredOptions}
            keyExtractor={(option) => option.value}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            ListEmptyComponent={<EmptyState icon="search" title="No matches" message={emptyMessage} />}
            renderItem={({ item }) => {
              const selected = item.value === value;
              return (
                <AppPressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={item.description ? `${item.label}, ${item.description}` : item.label}
                  onPress={() => select(item)}
                  style={({ pressed }) => [styles.option, pressed && { backgroundColor: theme.surfaceMuted }]}>
                  <View style={styles.optionText}>
                    <ThemedText variant="bodyStrong" color={selected ? "primary" : "text"}>
                      {item.label}
                    </ThemedText>
                    {item.description && (
                      <ThemedText variant="caption" color="textSecondary">
                        {item.description}
                      </ThemedText>
                    )}
                  </View>
                  {selected && <Icon name="check" size={20} color={theme.primary} />}
                </AppPressable>
              );
            }}
          />
        </View>
      </Modal>
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
    gap: 8,
    minHeight: 52,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
  },
  fieldText: {
    flex: 1,
  },
  sheet: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBox: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
});
