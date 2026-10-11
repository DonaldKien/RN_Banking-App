/**
 * Integration tests for the review → authenticate → submit → receipt flow,
 * rendered through the real Expo Router routes, Redux store and TanStack Query.
 * Only the device boundary (biometrics) is mocked.
 */
import * as LocalAuthentication from "expo-local-authentication";
import { fireEvent, renderRouter, screen } from "expo-router/testing-library";

import { scenarioChanged } from "@/features/demo/demo-slice";
import { draftStarted } from "@/features/transfer/transfer-slice";
import { db, resetDb } from "@/services/mock-server/db";
import type { Recipient } from "@/services/api/types";
import { store } from "@/store";

jest.mock("expo-local-authentication", () => {
  const actual = jest.requireActual("expo-local-authentication");
  return {
    ...actual,
    hasHardwareAsync: jest.fn(async () => true),
    isEnrolledAsync: jest.fn(async () => true),
    supportedAuthenticationTypesAsync: jest.fn(async () => [actual.AuthenticationType.FACIAL_RECOGNITION]),
    getEnrolledLevelAsync: jest.fn(async () => actual.SecurityLevel.BIOMETRIC_STRONG),
    authenticateAsync: jest.fn(),
  };
});

let mockUuid = 0;
jest.mock("expo-crypto", () => ({ randomUUID: () => `uuid-${++mockUuid}` }));

jest.setTimeout(30_000);

const authenticateAsync = jest.mocked(LocalAuthentication.authenticateAsync);

const recipient: Recipient = {
  id: "r1",
  name: "Aisyah Lim",
  type: "BANK_ACCOUNT",
  accountId: "1234567890",
  bankCode: "MBB",
  bankName: "Maybank",
};

const SLOW = { timeout: 10_000 };

/** Reads the mock server's balance synchronously (renderRouter enables fake timers). */
const serverBalance = () => db.state.account.balance;

const openReview = async () => {
  store.dispatch(draftStarted({ recipient, amountText: "25" }));
  const app = renderRouter("./src/app", { initialUrl: "/transfer/review" });
  // The confirm button is labelled with the detected biometric type.
  await screen.findByLabelText("Confirm with Face ID", undefined, SLOW);
  return app;
};

beforeEach(() => {
  resetDb();
  authenticateAsync.mockReset();
  store.dispatch(scenarioChanged("none"));
});

it("authenticates with biometrics, sends the money and shows the receipt", async () => {
  authenticateAsync.mockResolvedValue({ success: true });
  const before = serverBalance();
  const app = await openReview();

  fireEvent.press(screen.getByTestId("confirm-transfer"));

  await screen.findByText("Transfer successful", undefined, SLOW);
  expect(app.getPathname()).toBe("/transfer/success");
  expect(authenticateAsync).toHaveBeenCalledWith(
    expect.objectContaining({ promptMessage: "Send RM 25.00", promptSubtitle: "to Aisyah Lim" }),
  );
  expect(serverBalance()).toBe(before - 2500);
});

it("does not send anything when the user cancels the biometric prompt", async () => {
  authenticateAsync.mockResolvedValue({ success: false, error: "user_cancel" });
  const before = serverBalance();
  const app = await openReview();

  fireEvent.press(screen.getByTestId("confirm-transfer"));

  await screen.findByText(/authentication was cancelled/, undefined, SLOW);
  expect(app.getPathname()).toBe("/transfer/review");
  expect(serverBalance()).toBe(before);
});

it("falls back to the transaction PIN after a biometric lockout", async () => {
  authenticateAsync.mockResolvedValue({ success: false, error: "lockout" });
  await openReview();

  fireEvent.press(screen.getByTestId("confirm-transfer"));
  await screen.findByText("Enter transaction PIN", undefined, SLOW);
  for (const digit of "123456") fireEvent.press(screen.getByLabelText(digit));

  await screen.findByText("Transfer successful", undefined, SLOW);
});

it("offers a safe retry after a network error, without double-charging", async () => {
  authenticateAsync.mockResolvedValue({ success: true });
  const before = serverBalance();
  store.dispatch(scenarioChanged("network_error"));
  await openReview();

  fireEvent.press(screen.getByTestId("confirm-transfer"));
  await screen.findByText("You're offline", undefined, SLOW);
  expect(serverBalance()).toBe(before);

  // The scenario was one-shot, so the retry succeeds.
  fireEvent.press(screen.getByText("Try again"));
  await screen.findByText("Transfer successful", undefined, SLOW);
  expect(serverBalance()).toBe(before - 2500);
  // Re-authentication is required for every attempt.
  expect(authenticateAsync).toHaveBeenCalledTimes(2);
});
