/**
 * The transfer draft: what the user is about to send. It lives in Redux
 * because it spans several screens (form → recipient picker → review) and
 * must survive navigation, while being purely client-side state.
 */
import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";

import { amountTextToSen, sanitizeAmountInput } from "@/lib/money";
import type { Recipient } from "@/services/api/types";
import type { RootState } from "@/store";

export interface TransferDraftState {
  recipient: Recipient | null;
  /** Raw, sanitised text of the amount field (e.g. `"12.5"`). */
  amountText: string;
  note: string;
  /**
   * Identifies one *attempt* to send this exact draft. It is created when the
   * user reaches the review step and reused for retries, so a retry after a
   * timeout can never send the money twice. Any edit invalidates it.
   */
  idempotencyKey: string | null;
}

const initialState: TransferDraftState = {
  recipient: null,
  amountText: "",
  note: "",
  idempotencyKey: null,
};

const transferSlice = createSlice({
  name: "transfer",
  initialState,
  reducers: {
    /** Starts a fresh draft, optionally pre-filled (quick send / send again). */
    draftStarted(
      _state,
      action: PayloadAction<
        | { recipient?: Recipient; amountText?: string; note?: string }
        | undefined
      >,
    ) {
      return {
        ...initialState,
        recipient: action.payload?.recipient ?? null,
        amountText: sanitizeAmountInput(action.payload?.amountText ?? ""),
        note: action.payload?.note ?? "",
      };
    },
    recipientSelected(state, action: PayloadAction<Recipient>) {
      state.recipient = action.payload;
      state.idempotencyKey = null;
    },
    amountChanged(state, action: PayloadAction<string>) {
      state.amountText = sanitizeAmountInput(action.payload);
      state.idempotencyKey = null;
    },
    noteChanged(state, action: PayloadAction<string>) {
      state.note = action.payload;
      state.idempotencyKey = null;
    },
    /** Called on entering review; keeps an existing key so retries stay idempotent. */
    attemptPrepared(state, action: PayloadAction<string>) {
      state.idempotencyKey ??= action.payload;
    },
    draftCleared() {
      return initialState;
    },
  },
});

export const {
  draftStarted,
  recipientSelected,
  amountChanged,
  noteChanged,
  attemptPrepared,
  draftCleared,
} = transferSlice.actions;

export default transferSlice.reducer;

// Granular selectors: each screen subscribes only to the fields it renders,
// so typing in the amount field does not re-render the recipient card.
export const selectRecipient = (state: RootState) => state.transfer.recipient;
export const selectAmountText = (state: RootState) => state.transfer.amountText;
export const selectNote = (state: RootState) => state.transfer.note;
export const selectIdempotencyKey = (state: RootState) =>
  state.transfer.idempotencyKey;
export const selectAmountSen = createSelector(selectAmountText, (text) =>
  amountTextToSen(text),
);
