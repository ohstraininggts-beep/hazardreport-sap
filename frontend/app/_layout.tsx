import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import { LogBox, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { queryClient } from "@/src/query-client";
import { AuthProvider } from "@/src/auth";
import { useTheme } from "@/src/theme";

LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  const [loaded] = useFonts({
    PlusJakartaRegular: require("../assets/fonts/PlusJakartaSans-Regular.ttf"),
    PlusJakartaMedium: require("../assets/fonts/PlusJakartaSans-Medium.ttf"),
    PlusJakartaSemiBold: require("../assets/fonts/PlusJakartaSans-SemiBold.ttf"),
    PlusJakartaBold: require("../assets/fonts/PlusJakartaSans-Bold.ttf"),
    PlusJakartaExtraBold: require("../assets/fonts/PlusJakartaSans-ExtraBold.ttf"),
  });

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: "#0B0B0F" }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <KeyboardProvider>
                <ThemedStack />
              </KeyboardProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function ThemedStack() {
  const { colors, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.surface } }} />
    </>
  );
}
