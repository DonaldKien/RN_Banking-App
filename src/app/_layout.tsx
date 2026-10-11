import { QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Provider as ReduxProvider } from "react-redux";

import { useIsDark, useTheme } from "@/hooks/use-theme";
import { createQueryClient, subscribeAppFocus } from "@/lib/query-client";
import { store } from "@/store";

const RootLayout = () => {
  // Created once per app instance (not at module scope) so tests and fast
  // refresh get a clean cache.
  const [queryClient] = useState(createQueryClient);

  useEffect(() => subscribeAppFocus(), []);

  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppNavigator />
      </QueryClientProvider>
    </ReduxProvider>
  );
};

export default RootLayout;

const AppNavigator = () => {
  const theme = useTheme();
  const dark = useIsDark();
  const base = dark ? DarkTheme : DefaultTheme;

  const navigationTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.background,
      text: theme.text,
      border: theme.border,
    },
  };

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={dark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: "600" },
          headerBackButtonDisplayMode: "minimal",
          contentStyle: { backgroundColor: theme.background },
        }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="history/index" options={{ title: "Transactions" }} />
        <Stack.Screen name="transaction/[id]/index" options={{ title: "Transaction details" }} />
        <Stack.Screen name="transfer/index" options={{ title: "Transfer" }} />
        <Stack.Screen name="transfer/recipients/index" options={{ title: "Choose recipient" }} />
        <Stack.Screen name="transfer/new-recipient/index" options={{ title: "New recipient" }} />
        <Stack.Screen name="transfer/review/index" options={{ title: "Review transfer" }} />
        <Stack.Screen
          name="transfer/success/index"
          options={{ headerShown: false, gestureEnabled: false, animation: "fade" }}
        />
        <Stack.Screen name="demo-settings/index" options={{ title: "Demo controls", presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  );
};
