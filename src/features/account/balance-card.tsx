import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Radius } from "@/constants/theme";
import { balanceVisibilityToggled, selectBalanceHidden } from "@/features/preferences/preferences-slice";
import { useTheme } from "@/hooks/use-theme";
import { maskAccountNumber } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { useAppDispatch, useAppSelector } from "@/store";

import { useAccount } from "./queries";

const HIDDEN_AMOUNT = "RM ••••••";

export const BalanceCard = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const hidden = useAppSelector(selectBalanceHidden);
  const { data: account, isPending, refetch, isRefetching } = useAccount();

  const onPrimary = { color: theme.onPrimary };
  const muted = { color: theme.onPrimary, opacity: 0.75 };

  return (
    <View style={[styles.card, { backgroundColor: theme.primary }]}>
      {/* Decorative shapes */}
      <View style={[styles.blob, styles.blobLarge]} />
      <View style={[styles.blob, styles.blobSmall]} />

      <View style={styles.header}>
        <ThemedText variant="caption" style={muted}>
          Available balance
        </ThemedText>
        <IconButton
          icon={hidden ? "eye" : "eyeOff"}
          label={hidden ? "Show balance" : "Hide balance"}
          tone="onPrimary"
          onPress={() => dispatch(balanceVisibilityToggled())}
        />
      </View>

      {/* Prefer cached data: a failed background refresh keeps the last known balance. */}
      {isPending ? (
        <View style={styles.loading}>
          <Skeleton width={200} height={40} style={styles.skeleton} />
          <Skeleton width={140} height={14} style={styles.skeleton} />
        </View>
      ) : !account ? (
        <View style={styles.loading}>
          <ThemedText variant="bodyStrong" style={onPrimary}>
            {"We couldn't load your balance."}
          </ThemedText>
          <Button
            title="Try again"
            size="sm"
            variant="secondary"
            loading={isRefetching}
            onPress={() => void refetch()}
            style={styles.retry}
          />
        </View>
      ) : (
        <Animated.View entering={FadeIn} style={styles.loading}>
          <ThemedText
            variant="display"
            style={onPrimary}
            accessibilityLabel={hidden ? "Balance hidden" : `Balance ${formatMoney(account.balance)}`}>
            {hidden ? HIDDEN_AMOUNT : formatMoney(account.balance)}
          </ThemedText>
          <ThemedText variant="caption" style={muted}>
            {account.productName} · {maskAccountNumber(account.accountNumber)}
          </ThemedText>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    padding: 24,
    gap: 8,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  loading: {
    gap: 8,
    minHeight: 72,
  },
  skeleton: {
    opacity: 0.4,
  },
  retry: {
    alignSelf: "flex-start",
  },
  blob: {
    position: "absolute",
    borderRadius: Radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  blobLarge: {
    width: 220,
    height: 220,
    right: -70,
    top: -90,
  },
  blobSmall: {
    width: 120,
    height: 120,
    right: 40,
    bottom: -70,
  },
});
