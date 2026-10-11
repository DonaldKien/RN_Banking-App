import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { Avatar } from "@/components/ui/avatar";
import { Banner } from "@/components/ui/banner";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/hooks/use-theme";
import { isApiError } from "@/services/api/errors";

const describeLookupError = (
  error: unknown,
): { title: string; message: string; canRetry: boolean } => {
  if (isApiError(error) && error.code === "ACCOUNT_NOT_FOUND") {
    return {
      title: "Account not found",
      message: "Double-check the number and the bank you selected.",
      canRetry: false,
    };
  }

  if (isApiError(error)) {
    return {
      title: "Couldn't verify",
      message: error.message,
      canRetry: error.retryable,
    };
  }

  return {
    title: "Couldn't verify",
    message: "Please try again.",
    canRetry: true,
  };
};

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

const LookupErrorBanner = ({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) => {
  const { title, message, canRetry } = describeLookupError(error);
  return (
    <Banner
      tone="danger"
      title={title}
      message={message}
      actionLabel={canRetry ? "Try again" : undefined}
      onAction={onRetry}
    />
  );
};

export const AccountLookupStatus = ({
  isChecking,
  verifiedName,
  error,
  onRetry,
}: {
  isChecking: boolean;
  verifiedName: string | null;
  error: unknown;
  onRetry: () => void;
}) => {
  if (isChecking) return <CheckingIndicator />;
  if (verifiedName) return <VerifiedAccountHolder name={verifiedName} />;
  if (error) return <LookupErrorBanner error={error} onRetry={onRetry} />;
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
