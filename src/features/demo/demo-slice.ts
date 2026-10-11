/**
 * Demo controls so reviewers can exercise every error path and the PIN
 * fallback on any device or simulator. Not part of a production build.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { MockScenario } from "@/services/api/types";
import type { RootState } from "@/store";

export interface DemoState {
  transferScenario: MockScenario;
  /** Reset the scenario to "none" after it has been applied once. */
  scenarioOneShot: boolean;
  /** Pretend the device has no biometrics/passcode to demo the PIN fallback. */
  forcePinFallback: boolean;
}

const initialState: DemoState = {
  transferScenario: "none",
  scenarioOneShot: true,
  forcePinFallback: false,
};

const demoSlice = createSlice({
  name: "demo",
  initialState,
  reducers: {
    scenarioChanged(state, action: PayloadAction<MockScenario>) {
      state.transferScenario = action.payload;
    },
    scenarioOneShotToggled(state, action: PayloadAction<boolean>) {
      state.scenarioOneShot = action.payload;
    },
    scenarioConsumed(state) {
      if (state.scenarioOneShot) state.transferScenario = "none";
    },
    forcePinFallbackToggled(state, action: PayloadAction<boolean>) {
      state.forcePinFallback = action.payload;
    },
  },
});

export const { scenarioChanged, scenarioOneShotToggled, scenarioConsumed, forcePinFallbackToggled } =
  demoSlice.actions;

export default demoSlice.reducer;

export const selectDemo = (state: RootState) => state.demo;
export const selectTransferScenario = (state: RootState) => state.demo.transferScenario;
export const selectForcePinFallback = (state: RootState) => state.demo.forcePinFallback;
