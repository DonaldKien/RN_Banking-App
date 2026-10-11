// The transfer draft lives in Redux because it spans several screens.
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
  amountText: string;
  note: string;
  /** One per attempt: reused for retries (no double charge), cleared by any edit. */
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
    /** Keeps an existing key so retries stay idempotent. */
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

// Granular selectors so typing the amount doesn't re-render unrelated components.
export const selectRecipient = (state: RootState) => state.transfer.recipient;
export const selectAmountText = (state: RootState) => state.transfer.amountText;
export const selectNote = (state: RootState) => state.transfer.note;
export const selectIdempotencyKey = (state: RootState) =>
  state.transfer.idempotencyKey;
export const selectAmountSen = createSelector(selectAmountText, (text) =>
  amountTextToSen(text),
);
