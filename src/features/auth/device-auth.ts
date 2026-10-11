/**
 * Device authentication. Fallback order: biometrics -> device passcode ->
 * in-app transaction PIN (also used on web and after a biometric lockout).
 */
import {
  AuthenticationType,
  SecurityLevel,
  authenticateAsync,
  getEnrolledLevelAsync,
  hasHardwareAsync,
  isEnrolledAsync,
  supportedAuthenticationTypesAsync,
  type LocalAuthenticationResult,
} from "expo-local-authentication";
import { Platform } from "react-native";

import type { IconName } from "@/components/ui/icon";

export type AuthMethod = "biometric" | "device_credential" | "pin";

export interface AuthCapability {
  method: AuthMethod;
  /** e.g. "Face ID", "Fingerprint", "Transaction PIN". */
  label: string;
  icon: IconName;
  /** Android: a Class 3 (strong) biometric is enrolled. */
  strongBiometrics: boolean;
}

export type DeviceAuthOutcome =
  | { status: "success" }
  | { status: "cancelled" }
  /** Switch to the transaction PIN. */
  | { status: "fallback"; message: string }
  /** May be retried. */
  | { status: "failed"; message: string };

export const PIN_CAPABILITY: AuthCapability = {
  method: "pin",
  label: "Transaction PIN",
  icon: "pin",
  strongBiometrics: false,
};

const biometricLabel = (types: AuthenticationType[]): { label: string; icon: IconName } => {
  const hasFace = types.includes(AuthenticationType.FACIAL_RECOGNITION);
  const hasFingerprint = types.includes(AuthenticationType.FINGERPRINT);
  if (Platform.OS === "ios") {
    return hasFace ? { label: "Face ID", icon: "faceId" } : { label: "Touch ID", icon: "fingerprint" };
  }
  if (hasFingerprint) return { label: "Fingerprint", icon: "fingerprint" };
  if (hasFace) return { label: "Face Unlock", icon: "faceId" };
  if (types.includes(AuthenticationType.IRIS)) return { label: "Iris", icon: "faceId" };
  return { label: "Biometrics", icon: "fingerprint" };
};

export const getAuthCapability = async (): Promise<AuthCapability> => {
  if (Platform.OS === "web") return PIN_CAPABILITY;

  try {
    const [hasHardware, isEnrolled, types, level] = await Promise.all([
      hasHardwareAsync(),
      isEnrolledAsync(),
      supportedAuthenticationTypesAsync(),
      getEnrolledLevelAsync(),
    ]);

    if (hasHardware && isEnrolled && level >= SecurityLevel.BIOMETRIC_WEAK) {
      return {
        method: "biometric",
        ...biometricLabel(types),
        strongBiometrics: level === SecurityLevel.BIOMETRIC_STRONG,
      };
    }
    if (level === SecurityLevel.SECRET) {
      return {
        method: "device_credential",
        label: Platform.OS === "ios" ? "Passcode" : "Screen lock",
        icon: "lock",
        strongBiometrics: false,
      };
    }
  } catch {
    // Detection failed: fall back to the PIN.
  }
  return PIN_CAPABILITY;
};

export const mapAuthResult = (result: LocalAuthenticationResult): DeviceAuthOutcome => {
  if (result.success) return { status: "success" };

  switch (result.error) {
    case "user_cancel":
    case "system_cancel":
    case "app_cancel":
      return { status: "cancelled" };
    case "user_fallback":
      return { status: "fallback", message: "Enter your transaction PIN to continue." };
    case "lockout":
      return {
        status: "fallback",
        message: "Biometrics are locked after too many attempts. Use your transaction PIN instead.",
      };
    case "not_enrolled":
    case "not_available":
    case "passcode_not_set":
      return {
        status: "fallback",
        message: "Biometrics aren't available on this device. Use your transaction PIN instead.",
      };
    case "authentication_failed":
      return { status: "failed", message: "We couldn't verify it's you. Please try again." };
    case "timeout":
      return { status: "failed", message: "Authentication timed out. Please try again." };
    default:
      return { status: "failed", message: "Authentication didn't complete. Please try again." };
  }
};

/** The prompt names the amount and recipient so the user knows what they approve. */
export const authenticateWithDevice = async (
  capability: AuthCapability,
  prompt: { message: string; subtitle?: string },
): Promise<DeviceAuthOutcome> => {
  if (capability.method === "pin") {
    return { status: "fallback", message: "Enter your transaction PIN to continue." };
  }

  try {
    const result = await authenticateAsync({
      promptMessage: prompt.message,
      promptSubtitle: prompt.subtitle,
      cancelLabel: "Cancel",
      // iOS: biometrics-only, so "Use PIN" opens our PIN rather than the device passcode.
      disableDeviceFallback: capability.method === "biometric",
      fallbackLabel: capability.method === "biometric" ? "Use PIN" : undefined,
      // Android: require Class 3 biometrics when available.
      biometricsSecurityLevel: capability.strongBiometrics ? "strong" : "weak",
      requireConfirmation: true,
    });
    return mapAuthResult(result);
  } catch {
    return {
      status: "fallback",
      message: "Device authentication isn't working right now. Use your transaction PIN instead.",
    };
  }
};
