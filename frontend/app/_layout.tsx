import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { LogBox, View } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { AuthProvider } from "@/src/auth";

LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  const [loaded] = useFonts({
    Archivo: require("../assets/fonts/Archivo.ttf"),
    IBMPlexSans: require("../assets/fonts/IBMPlexSans.ttf"),
    IBMPlexMono: require("../assets/fonts/IBMPlexMono-Regular.ttf"),
    IBMPlexMonoSemiBold: require("../assets/fonts/IBMPlexMono-SemiBold.ttf"),
  });

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: "#111111" }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <KeyboardProvider>
                <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#FFFFFF" } }} />
              </KeyboardProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
