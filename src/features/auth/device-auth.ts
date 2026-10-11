/**
 * Device authentication (Face ID / Touch ID / fingerprint / device passcode).
 *
 * The rest of the app never touches `expo-local-authentication` directly: it
 * asks for the device's capability once, then calls `authenticateWithDevice`
 * and receives a small, UI-friendly outcome union.
 *
 * Fallback strategy, in order of preference:
 *   1. Biometrics, when hardware exists and the user has enrolled.
 *   2. The device passcode / screen lock, when set but no biometrics enrolled.
 *   3. The in-app transaction PIN (also used on web and on biometric lockout).
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
  /** Human-readable name, e.g. "Face ID", "Fingerprint", "Transaction PIN". */
  label: string;
  icon: IconName;
  /** Android only: whether a Class 3 (strong) biometric is enrolled. */
  strongBiometrics: boolean;
}

export type DeviceAuthOutcome =
  | { status: "success" }
  /** The user dismissed the prompt; return quietly to the review screen. */
  | { status: "cancelled" }
  /** Device auth can't be used right now; switch to the transaction PIN. */
  | { status: "fallback"; message: string }
  /** Authentication failed but may be retried. */
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

/** Detects the strongest authentication method this device supports right now. */
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
    // Treat any capability-detection failure as "no device auth".
  }
  return PIN_CAPABILITY;
};

/** Maps the library's result to the outcomes the UI cares about. */
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

/**
 * Shows the system authentication prompt for a specific transfer.
 * The prompt text names the amount and recipient so the user knows exactly
 * what they are approving.
 */
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
      // iOS: biometrics-only policy so "Use PIN" routes to our own PIN screen
      // instead of the device passcode. For passcode-only devices we keep the
      // device-owner policy, which is what makes the passcode prompt appear.
      disableDeviceFallback: capability.method === "biometric",
      fallbackLabel: capability.method === "biometric" ? "Use PIN" : undefined,
      // Android: require Class 3 biometrics when the device has them.
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
