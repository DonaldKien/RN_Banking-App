import { createStore } from "@/store";
import type { Recipient } from "@/services/api/types";

import {
  amountChanged,
  attemptPrepared,
  draftStarted,
  noteChanged,
  recipientSelected,
  selectAmountSen,
  selectIdempotencyKey,
} from "../transfer-slice";

const recipient: Recipient = {
  id: "r1",
  name: "Aisyah Lim",
  type: "DUITNOW_MOBILE",
  accountId: "60123456789",
  bankName: "DuitNow · Mobile",
};

describe("transfer draft", () => {
  it("sanitises the amount and exposes it in sen", () => {
    const store = createStore();
    store.dispatch(amountChanged("0012.345"));
    expect(store.getState().transfer.amountText).toBe("12.34");
    expect(selectAmountSen(store.getState())).toBe(1234);
  });

  it("keeps the idempotency key across retries", () => {
    const store = createStore();
    store.dispatch(draftStarted({ recipient, amountText: "10" }));
    store.dispatch(attemptPrepared("key-1"));
    store.dispatch(attemptPrepared("key-2"));
    expect(selectIdempotencyKey(store.getState())).toBe("key-1");
  });

  it.each([
    ["amount", amountChanged("20")],
    ["note", noteChanged("Lunch")],
    ["recipient", recipientSelected({ ...recipient, id: "r2", accountId: "60198765432" })],
  ])("invalidates the idempotency key when the %s changes", (_field, action) => {
    const store = createStore();
    store.dispatch(draftStarted({ recipient, amountText: "10" }));
    store.dispatch(attemptPrepared("key-1"));
    store.dispatch(action);
    expect(selectIdempotencyKey(store.getState())).toBeNull();
  });

  it("starts a fresh, pre-filled draft for 'send again'", () => {
    const store = createStore();
    store.dispatch(noteChanged("old"));
    store.dispatch(draftStarted({ recipient, amountText: "25.5" }));
    expect(store.getState().transfer).toEqual({
      recipient,
      amountText: "25.5",
      note: "",
      idempotencyKey: null,
    });
  });
});
