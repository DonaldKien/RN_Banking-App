import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { MaxContentWidth, Radius } from "@/constants/theme";
import { SAMPLE_ACCOUNT } from "@/constants/sample-data";
import { BalanceCard } from "@/features/account/balance-card";
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
          <BalanceCard />
        </View>

        <View style={[styles.actions, styles.padded]}>
          <Button title="Transfer" icon="send" onPress={() => {}} style={styles.flex} />
          <Button title="History" icon="history" variant="secondary" onPress={() => {}} style={styles.flex} />
        </View>

        <View style={styles.section}>
          <ThemedText variant="heading" style={styles.padded}>
            Quick send
          </ThemedText>
          <View style={[styles.placeholder, styles.padded, { backgroundColor: theme.surfaceMuted }]} />
        </View>

        <View style={[styles.section, styles.padded]}>
          <ThemedText variant="heading">Recent activity</ThemedText>
          <Card style={styles.listCard}>
            {Array.from({ length: 4 }, (_, i) => (
              <View key={i} style={styles.skeletonRow}>
                <Skeleton width={40} height={40} radius={20} />
                <View style={styles.flex}>
                  <Skeleton width="60%" height={14} />
                  <Skeleton width="35%" height={12} style={styles.skeletonGap} />
                </View>
              </View>
            ))}
          </Card>
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
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  flex: {
    flex: 1,
  },
  section: {
    gap: 12,
  },
  placeholder: {
    borderRadius: Radius.xl,
    minHeight: 80,
  },
  listCard: {
    paddingHorizontal: 0,
    paddingVertical: 4,
    overflow: "hidden",
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  skeletonGap: {
    marginTop: 8,
  },
});
