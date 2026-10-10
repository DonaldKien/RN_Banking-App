import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/hooks/use-theme";

const CheckingIndicator = () => {
  const theme = useTheme();
  return (
    <View style={styles.checking} accessibilityLiveRegion="polite">
      <ActivityIndicator color={theme.primary} />
      <ThemedText variant="caption" color="textSecondary">
        Verifying account holder…
      </ThemedText>
    </View>
  );
};

const VerifiedAccountHolder = ({ name }: { name: string }) => {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeIn}>
      <Card style={styles.verified}>
        <Avatar name={name} />
        <View style={styles.verifiedText}>
          <ThemedText variant="bodyStrong">{name}</ThemedText>
          <View style={styles.verifiedBadge}>
            <Icon name="shield" size={14} color={theme.success} />
            <ThemedText variant="caption" color="success">
              Verified account holder
            </ThemedText>
          </View>
        </View>
      </Card>
    </Animated.View>
  );
};

const LookupError = ({ message }: { message: string }) => {
  const theme = useTheme();
  return (
    <View style={styles.checking} accessibilityRole="alert">
      <Icon name="error" size={16} color={theme.danger} />
      <ThemedText variant="caption" color="danger">
        {message}
      </ThemedText>
    </View>
  );
};

/**
 * Shows the state of the account-holder name check, one state at a time:
 * checking → verified name, or an error. Shows nothing before the details
 * are complete.
 */
export const AccountLookupStatus = ({
  isChecking,
  verifiedName,
  error,
}: {
  isChecking: boolean;
  verifiedName: string | null;
  error: string | null;
}) => {
  if (isChecking) return <CheckingIndicator />;
  if (verifiedName) return <VerifiedAccountHolder name={verifiedName} />;
  if (error) return <LookupError message={error} />;
  return null;
};

const styles = StyleSheet.create({
  checking: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  verifiedText: {
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
