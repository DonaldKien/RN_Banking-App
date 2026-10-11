import { QueryClient, focusManager } from "@tanstack/react-query";
import { AppState, Platform, type AppStateStatus } from "react-native";

import { isRetryableError } from "@/services/api/errors";

/**
 * TanStack Query owns all *server* state (balance, recipients, history).
 * Redux only holds client state such as the in-progress transfer draft.
 */
export const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Only retry failures that might succeed on a second attempt.
        retry: (failureCount, error) => isRetryableError(error) && failureCount < 2,
      },
      mutations: {
        // Never retry money movement implicitly; the UI offers an explicit,
        // idempotent retry instead.
        retry: false,
      },
    },
  });
};

/** Refetch stale queries when the app returns to the foreground. */
export const subscribeAppFocus = (): () => void => {
  if (Platform.OS === "web") return () => {};
  const onChange = (status: AppStateStatus) => focusManager.setFocused(status === "active");
  const subscription = AppState.addEventListener("change", onChange);
  return () => subscription.remove();
};
