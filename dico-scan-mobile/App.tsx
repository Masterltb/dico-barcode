// App.tsx — Entry point for DICO Scan Mobile
// Wires up: QueryClient, Preferences hydration, RootNavigator

import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { RootNavigator } from "@/navigation/RootNavigator";
import { usePreferencesStore } from "@/store/userPreferencesStore";
import "./global.css"; // NativeWind

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 min global default
      retry: 1,
    },
  },
});

function AppRoot() {
  const hydrate = usePreferencesStore((s) => s.hydrate);

  useEffect(() => {
    // Hydrate user preferences from AsyncStorage on app start (AC_PREF_02)
    hydrate();
  }, [hydrate]);

  return (
    <>
      <StatusBar style="light" backgroundColor="#0F172A" />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoot />
    </QueryClientProvider>
  );
}
