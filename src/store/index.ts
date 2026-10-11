import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, useStore } from "react-redux";

import preferencesReducer from "@/features/preferences/preferences-slice";
import transferReducer from "@/features/transfer/transfer-slice";

const rootReducer = combineReducers({
  transfer: transferReducer,
  preferences: preferencesReducer,
});

export type RootState = ReturnType<typeof rootReducer>;

export const createStore = (preloadedState?: Partial<RootState>) => {
  return configureStore({ reducer: rootReducer, preloadedState });
};

export const store = createStore();

export type AppStore = ReturnType<typeof createStore>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
