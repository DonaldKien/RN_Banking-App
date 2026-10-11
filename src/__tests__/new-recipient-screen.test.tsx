/**
 * Screen test for the new-recipient form (React Hook Form + Zod), rendered
 * through the real routes, store, query client and mock server.
 */
import { fireEvent, renderRouter, screen } from "expo-router/testing-library";

import { NEW_RECIPIENT_MESSAGES } from "@/features/recipients/new-recipient-form";
import { draftStarted } from "@/features/transfer/transfer-slice";
import { resetDb } from "@/services/mock-server/db";
import { store } from "@/store";

let mockUuid = 0;
jest.mock("expo-crypto", () => ({ randomUUID: () => `uuid-${++mockUuid}` }));

jest.setTimeout(30_000);

const SLOW = { timeout: 10_000 };

const openNewRecipient = async () => {
  store.dispatch(draftStarted());
  // Start from the transfer form so "Continue" can go back to it.
  const app = renderRouter("./src/app", { initialUrl: "/transfer" });
  fireEvent.press(await screen.findByTestId("recipient-field", undefined, SLOW));
  fireEvent.press(await screen.findByLabelText("Pay a new account or mobile number", undefined, SLOW));
  await screen.findByText("Account number", undefined, SLOW);
  return app;
};

beforeEach(() => {
  resetDb();
});

it("shows every missing field when Continue is pressed on an empty form", async () => {
  await openNewRecipient();

  fireEvent.press(screen.getByTestId("confirm-recipient"));

  await screen.findByText(NEW_RECIPIENT_MESSAGES.bankRequired, undefined, SLOW);
  expect(screen.getByText(NEW_RECIPIENT_MESSAGES.accountNumberInvalid)).toBeTruthy();
});

it("verifies the account holder and returns the recipient to the transfer form", async () => {
  const app = await openNewRecipient();

  fireEvent.press(screen.getByTestId("bank-dropdown"));
  fireEvent.press(await screen.findByLabelText("Maybank, Malayan Banking Berhad", undefined, SLOW));
  fireEvent.changeText(screen.getByLabelText("Account number"), "1234 5678 90");

  await screen.findByText("Verified account holder", undefined, SLOW);
  fireEvent.press(screen.getByTestId("confirm-recipient"));

  await screen.findByText("Change", undefined, SLOW);
  expect(app.getPathname()).toBe("/transfer");
  expect(store.getState().transfer.recipient).toMatchObject({
    type: "BANK_ACCOUNT",
    bankCode: "MBB",
    accountId: "1234567890",
  });
});

it("validates the mobile number when switching to DuitNow", async () => {
  await openNewRecipient();

  fireEvent.press(screen.getByText("Mobile number"));
  const mobile = await screen.findByLabelText("Mobile number", undefined, SLOW);
  fireEvent.changeText(mobile, "03-1234 5678");
  fireEvent(mobile, "blur");

  await screen.findByText(NEW_RECIPIENT_MESSAGES.mobileInvalid, undefined, SLOW);
});
