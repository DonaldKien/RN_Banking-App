import * as LocalAuthentication from "expo-local-authentication";

import { authenticateWithDevice, getAuthCapability, mapAuthResult, PIN_CAPABILITY } from "../device-auth";

jest.mock("expo-local-authentication", () => {
  const actual = jest.requireActual("expo-local-authentication");
  return {
    ...actual,
    hasHardwareAsync: jest.fn(),
    isEnrolledAsync: jest.fn(),
    supportedAuthenticationTypesAsync: jest.fn(),
    getEnrolledLevelAsync: jest.fn(),
    authenticateAsync: jest.fn(),
  };
});

const mocked = jest.mocked(LocalAuthentication);
const { AuthenticationType, SecurityLevel } = LocalAuthentication;

const mockDevice = ({
  hardware,
  enrolled,
  types,
  level,
}: {
  hardware: boolean;
  enrolled: boolean;
  types: LocalAuthentication.AuthenticationType[];
  level: LocalAuthentication.SecurityLevel;
}) => {
  mocked.hasHardwareAsync.mockResolvedValue(hardware);
  mocked.isEnrolledAsync.mockResolvedValue(enrolled);
  mocked.supportedAuthenticationTypesAsync.mockResolvedValue(types);
  mocked.getEnrolledLevelAsync.mockResolvedValue(level);
};

describe("getAuthCapability", () => {
  it("prefers enrolled biometrics", async () => {
    mockDevice({
      hardware: true,
      enrolled: true,
      types: [AuthenticationType.FINGERPRINT],
      level: SecurityLevel.BIOMETRIC_STRONG,
    });
    await expect(getAuthCapability()).resolves.toMatchObject({ method: "biometric", strongBiometrics: true });
  });

  it("falls back to the device passcode when biometrics aren't enrolled", async () => {
    mockDevice({ hardware: true, enrolled: false, types: [AuthenticationType.FINGERPRINT], level: SecurityLevel.SECRET });
    await expect(getAuthCapability()).resolves.toMatchObject({ method: "device_credential" });
  });

  it("falls back to the transaction PIN when the device has no security", async () => {
    mockDevice({ hardware: false, enrolled: false, types: [], level: SecurityLevel.NONE });
    await expect(getAuthCapability()).resolves.toEqual(PIN_CAPABILITY);
  });

  it("falls back to the transaction PIN when detection throws", async () => {
    mocked.hasHardwareAsync.mockRejectedValue(new Error("boom"));
    await expect(getAuthCapability()).resolves.toEqual(PIN_CAPABILITY);
  });
});

describe("mapAuthResult", () => {
  it("maps success", () => {
    expect(mapAuthResult({ success: true })).toEqual({ status: "success" });
  });

  it.each(["user_cancel", "system_cancel", "app_cancel"] as const)("treats %s as a quiet cancel", (error) => {
    expect(mapAuthResult({ success: false, error })).toEqual({ status: "cancelled" });
  });

  it.each(["user_fallback", "lockout", "not_enrolled", "not_available", "passcode_not_set"] as const)(
    "routes %s to the PIN fallback",
    (error) => {
      expect(mapAuthResult({ success: false, error }).status).toBe("fallback");
    },
  );

  it("lets the user retry after a failed match", () => {
    expect(mapAuthResult({ success: false, error: "authentication_failed" }).status).toBe("failed");
  });
});

describe("authenticateWithDevice", () => {
  const biometric = { method: "biometric", label: "Face ID", icon: "faceId", strongBiometrics: true } as const;

  it("names the amount and recipient in the system prompt", async () => {
    mocked.authenticateAsync.mockResolvedValue({ success: true });
    await authenticateWithDevice(biometric, { message: "Send RM 10.00", subtitle: "to Aisyah" });
    expect(mocked.authenticateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        promptMessage: "Send RM 10.00",
        promptSubtitle: "to Aisyah",
        disableDeviceFallback: true,
        biometricsSecurityLevel: "strong",
      }),
    );
  });

  it("never shows a system prompt for PIN-only devices", async () => {
    mocked.authenticateAsync.mockClear();
    const outcome = await authenticateWithDevice(PIN_CAPABILITY, { message: "Send" });
    expect(outcome.status).toBe("fallback");
    expect(mocked.authenticateAsync).not.toHaveBeenCalled();
  });

  it("falls back to the PIN if the native call throws", async () => {
    mocked.authenticateAsync.mockRejectedValue(new Error("native failure"));
    await expect(authenticateWithDevice(biometric, { message: "Send" })).resolves.toMatchObject({
      status: "fallback",
    });
  });
});
