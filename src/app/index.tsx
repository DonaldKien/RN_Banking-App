import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { IconButton } from "@/components/ui/icon-button";
import { MaxContentWidth, Radius } from "@/constants/theme";
import { SAMPLE_ACCOUNT } from "@/constants/sample-data";
import { useTheme } from "@/hooks/use-theme";
import { greeting } from "@/lib/format";

const HomeScreen = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
      <View style={styles.inner}>
        <View style={[styles.header, styles.padded]}>
          <View style={styles.greeting}>
            <Avatar name={SAMPLE_ACCOUNT.holderName} size={40} />
            <View>
              <ThemedText variant="caption" color="textSecondary">
                {greeting()}
              </ThemedText>
              <ThemedText variant="heading">{SAMPLE_ACCOUNT.holderName}</ThemedText>
            </View>
          </View>
          <IconButton icon="tune" label="Demo controls" onPress={() => {}} />
        </View>

        <View style={styles.padded}>
          <View style={[styles.placeholder, styles.balance, { backgroundColor: theme.primary }]}>
            <ThemedText variant="caption" color="onPrimary">
              Available balance
            </ThemedText>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText variant="heading" style={styles.padded}>
            Quick send
          </ThemedText>
          <View style={[styles.placeholder, styles.padded, { backgroundColor: theme.surfaceMuted }]} />
        </View>

        <View style={[styles.section, styles.padded]}>
          <ThemedText variant="heading">Recent activity</ThemedText>
          <View style={[styles.placeholder, styles.list, { backgroundColor: theme.surface }]} />
        </View>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  content: {
    paddingBottom: 48,
    alignItems: "center",
  },
  inner: {
    width: "100%",
    maxWidth: MaxContentWidth,
    gap: 24,
  },
  padded: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greeting: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  section: {
    gap: 12,
  },
  placeholder: {
    borderRadius: Radius.xl,
    minHeight: 80,
  },
  balance: {
    padding: 24,
    minHeight: 140,
  },
  list: {
    minHeight: 240,
  },
});
