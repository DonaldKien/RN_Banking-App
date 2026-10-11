import { QueryClient, focusManager } from "@tanstack/react-query";
import { AppState, Platform, type AppStateStatus } from "react-native";

import { isRetryableError } from "@/services/api/errors";

// TanStack Query owns server state; Redux holds client state (e.g. the transfer draft).
export const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => isRetryableError(error) && failureCount < 2,
      },
      mutations: {
        // Never retry money movement implicitly; the UI offers an idempotent retry.
        retry: false,
      },
    },
  });
};

export const subscribeAppFocus = (): () => void => {
  if (Platform.OS === "web") return () => {};
  const onChange = (status: AppStateStatus) => focusManager.setFocused(status === "active");
  const subscription = AppState.addEventListener("change", onChange);
  return () => subscription.remove();
};
