import { useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppPressable } from "@/components/ui/app-pressable";
import { ThemedText } from "@/components/themed-text";
import { Icon } from "@/components/ui/icon";
import { Radius } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { haptics } from "@/lib/haptics";
import { DEMO_PIN } from "@/services/mock-server/db";
import { isApiError } from "@/services/api/errors";

const PIN_LENGTH = 6;
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"] as const;

export const PinSheet = ({
  visible,
  reason,
  onSubmit,
  onCancel,
}: {
  visible: boolean;
  reason: string;
  /** Rejects with an ApiError for a wrong or locked PIN. */
  onSubmit: (pin: string) => Promise<void>;
  onCancel: () => void;
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [locked, setLocked] = useState(false);

  const shake = useSharedValue(0);
  const dotsStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.get() }] }));

  const reset = () => {
    setPin("");
    setError(null);
    setVerifying(false);
    // The server still rejects a locked PIN.
    setLocked(false);
  };

  const submit = async (fullPin: string) => {
    setVerifying(true);
    try {
      await onSubmit(fullPin);
      reset();
    } catch (err) {
      haptics.error();
      shake.set(
        withSequence(
          withTiming(-10, { duration: 50 }),
          withTiming(10, { duration: 50 }),
          withTiming(-6, { duration: 50 }),
          withTiming(0, { duration: 50 }),
        ),
      );
      setPin("");
      setVerifying(false);
      if (isApiError(err) && err.code === "PIN_LOCKED") {
        setLocked(true);
        setError("Your PIN is locked after too many attempts. Reset it from the demo controls.");
      } else if (isApiError(err) && err.code === "INVALID_PIN") {
        const left = err.details.attemptsRemaining;
        setError(`Incorrect PIN. ${String(left)} attempt${left === 1 ? "" : "s"} left.`);
      } else {
        setError(isApiError(err) ? err.message : "We couldn't verify your PIN. Please try again.");
      }
    }
  };

  const press = (key: (typeof KEYS)[number]) => {
    if (verifying || locked) return;
    haptics.selection();
    if (key === "back") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    const next = (pin + key).slice(0, PIN_LENGTH);
    setPin(next);
    setError(null);
    if (next.length === PIN_LENGTH) void submit(next);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        reset();
        onCancel();
      }}
      onDismiss={reset}>
      <View style={[styles.backdrop, { backgroundColor: theme.overlay }]}>
        <View
          style={[styles.sheet, { backgroundColor: theme.surface, paddingBottom: insets.bottom + 16 }]}
          accessibilityViewIsModal>
          <View style={styles.header}>
            <View style={[styles.lockIcon, { backgroundColor: theme.primarySoft }]}>
              <Icon name="lock" size={22} color={theme.primary} />
            </View>
            <AppPressable
              accessibilityRole="button"
              accessibilityLabel="Cancel"
              hitSlop={12}
              onPress={() => {
                reset();
                onCancel();
              }}>
              <Icon name="close" size={22} color={theme.textSecondary} />
            </AppPressable>
          </View>

          <ThemedText variant="title">Enter transaction PIN</ThemedText>
          <ThemedText variant="body" color="textSecondary">
            {reason}
          </ThemedText>

          <Animated.View
            style={[styles.dots, dotsStyle]}
            accessible
            accessibilityLabel={`${pin.length} of ${PIN_LENGTH} digits entered`}>
            {Array.from({ length: PIN_LENGTH }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { borderColor: error ? theme.danger : theme.border },
                  i < pin.length && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}
              />
            ))}
          </Animated.View>

          <ThemedText
            variant="caption"
            color={error ? "danger" : "textTertiary"}
            align="center"
            accessibilityLiveRegion="assertive">
            {verifying ? "Verifying…" : (error ?? `Demo PIN: ${DEMO_PIN}`)}
          </ThemedText>

          <View style={styles.keypad}>
            {KEYS.map((key, index) =>
              key === "" ? (
                <View key={index} style={styles.key} />
              ) : (
                <AppPressable
                  key={index}
                  accessibilityRole="button"
                  accessibilityLabel={key === "back" ? "Delete" : key}
                  disabled={verifying || locked}
                  onPress={() => press(key)}
                  style={({ pressed }) => [
                    styles.key,
                    pressed && { backgroundColor: theme.surfaceMuted },
                    (verifying || locked) && styles.keyDisabled,
                  ]}>
                  {key === "back" ? (
                    <Icon name="backspace" size={24} color={theme.text} />
                  ) : (
                    <ThemedText variant="title">{key}</ThemedText>
                  )}
                </AppPressable>
              ),
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: 24,
    gap: 12,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lockIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginVertical: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
  keypad: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  key: {
    width: "33.33%",
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radius.lg,
  },
  keyDisabled: {
    opacity: 0.4,
  },
});
