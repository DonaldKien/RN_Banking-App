import { createSlice } from "@reduxjs/toolkit";

import type { RootState } from "@/store";

export interface PreferencesState {
  /** Hide balances on screen, e.g. when using the app in public. */
  balanceHidden: boolean;
}

const initialState: PreferencesState = { balanceHidden: false };

const preferencesSlice = createSlice({
  name: "preferences",
  initialState,
  reducers: {
    balanceVisibilityToggled(state) {
      state.balanceHidden = !state.balanceHidden;
    },
  },
});

export const { balanceVisibilityToggled } = preferencesSlice.actions;
export default preferencesSlice.reducer;

export const selectBalanceHidden = (state: RootState) => state.preferences.balanceHidden;
