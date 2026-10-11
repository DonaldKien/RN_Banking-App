import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { StyleSheet, Switch, View } from "react-native";

import { AppPressable } from "@/components/ui/app-pressable";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DetailRow } from "@/components/ui/detail-row";
import { FormScreen } from "@/components/ui/form-screen";
import { useDeviceAuthCapability } from "@/features/auth/queries";
import {
  forcePinFallbackToggled,
  scenarioChanged,
  scenarioOneShotToggled,
  selectDemo,
} from "@/features/demo/demo-slice";
import { draftCleared } from "@/features/transfer/transfer-slice";
import { useTheme } from "@/hooks/use-theme";
import { haptics } from "@/lib/haptics";
import { resetDemoData } from "@/services/api/bank-api";
import { DEMO_PIN } from "@/services/mock-server/db";
import type { MockScenario } from "@/services/api/types";
import { useAppDispatch, useAppSelector } from "@/store";

const SCENARIOS: readonly { value: MockScenario; title: string; description: string }[] = [
  { value: "none", title: "Success", description: "Transfers complete normally." },
  {
    value: "network_error",
    title: "Network error",
    description: "The request never reaches the bank. No money moves.",
  },
  {
    value: "timeout",
    title: "Timeout after processing",
    description: "The bank completes the transfer but the response is lost. Retrying returns the original receipt.",
  },
  { value: "server_error", title: "Server error", description: "The transfer service fails with a 5xx." },
  {
    value: "insufficient_funds",
    title: "Insufficient funds",
    description: "The server rejects the transfer even if the app's balance looked sufficient.",
  },
];

/** Reviewer tooling: force failure modes and the PIN fallback on any device. */
const DemoSettingsScreen = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const demo = useAppSelector(selectDemo);
  const { data: deviceCapability } = useDeviceAuthCapability();

  const reset = useMutation({
    mutationFn: resetDemoData,
    onSuccess: async () => {
      dispatch(draftCleared());
      await queryClient.resetQueries();
      haptics.success();
      router.back();
    },
  });

  return (
    <FormScreen>
      <View style={styles.section}>
        <ThemedText variant="label" color="textSecondary">
          Next transfer outcome
        </ThemedText>
        <Card style={styles.list}>
          {SCENARIOS.map((scenario) => {
            const selected = demo.transferScenario === scenario.value;
            return (
              <AppPressable
                key={scenario.value}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  haptics.selection();
                  dispatch(scenarioChanged(scenario.value));
                }}
                style={({ pressed }) => [styles.option, pressed && { backgroundColor: theme.surfaceMuted }]}>
                <View style={[styles.radio, { borderColor: selected ? theme.primary : theme.border }]}>
                  {selected && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}
                </View>
                <View style={styles.flex}>
                  <ThemedText variant="bodyStrong">{scenario.title}</ThemedText>
                  <ThemedText variant="caption" color="textSecondary">
                    {scenario.description}
                  </ThemedText>
                </View>
              </AppPressable>
            );
          })}
        </Card>
        <SwitchRow
          title="Apply once"
          description="Return to “Success” after the next transfer attempt."
          value={demo.scenarioOneShot}
          onValueChange={(value) => dispatch(scenarioOneShotToggled(value))}
        />
      </View>

      <View style={styles.section}>
        <ThemedText variant="label" color="textSecondary">
          Authentication
        </ThemedText>
        <SwitchRow
          title="Force PIN fallback"
          description="Behave as if this device has no biometrics or passcode."
          value={demo.forcePinFallback}
          onValueChange={(value) => dispatch(forcePinFallbackToggled(value))}
        />
        <Card>
          <DetailRow label="This device supports" value={deviceCapability?.label ?? "Checking…"} />
          <DetailRow label="Demo transaction PIN" value={DEMO_PIN} mono />
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText variant="label" color="textSecondary">
          Data
        </ThemedText>
        <Button
          title="Reset balance & history"
          variant="danger"
          onPress={() => reset.mutate()}
          // Sends POST /v1/demo/reset: ignore double taps.
          throttle
          loading={reset.isPending}
        />
      </View>
    </FormScreen>
  );
};

export default DemoSettingsScreen;

const SwitchRow = ({
  title,
  description,
  value,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => {
  const theme = useTheme();
  return (
    <Card style={styles.switchRow}>
      <View style={styles.flex}>
        <ThemedText variant="bodyStrong">{title}</ThemedText>
        <ThemedText variant="caption" color="textSecondary">
          {description}
        </ThemedText>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: theme.primary, false: theme.border }}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  section: {
    gap: 8,
  },
  list: {
    padding: 0,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
