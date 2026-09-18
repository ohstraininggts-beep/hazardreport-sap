import React from "react";
import { Platform } from "react-native";
import { Tabs } from "expo-router";
import { House, Warning, ClipboardText, ChartBar } from "phosphor-react-native";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useTheme, fonts } from "@/src/theme";
import { usesNativeTabs } from "@/src/navigation";

export default function TabsLayout() {
  const { colors } = useTheme();

  if (usesNativeTabs) {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Icon sf="house.fill" />
          <NativeTabs.Trigger.Label>Beranda</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="hazard">
          <NativeTabs.Trigger.Icon sf="exclamationmark.triangle.fill" />
          <NativeTabs.Trigger.Label>Hazard</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="inspeksi">
          <NativeTabs.Trigger.Icon sf="checklist" />
          <NativeTabs.Trigger.Label>Inspeksi</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="dashboard">
          <NativeTabs.Trigger.Icon sf="chart.bar.fill" />
          <NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
        tabBarLabelStyle: { fontFamily: fonts.semibold, fontSize: 10.5, letterSpacing: 0.2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Beranda", tabBarIcon: ({ color, focused }) => <House size={24} color={color} weight={focused ? "fill" : "regular"} /> }}
      />
      <Tabs.Screen
        name="hazard"
        options={{ title: "Hazard", tabBarIcon: ({ color, focused }) => <Warning size={24} color={color} weight={focused ? "fill" : "regular"} /> }}
      />
      <Tabs.Screen
        name="inspeksi"
        options={{ title: "Inspeksi", tabBarIcon: ({ color, focused }) => <ClipboardText size={24} color={color} weight={focused ? "fill" : "regular"} /> }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{ title: "Dashboard", tabBarIcon: ({ color, focused }) => <ChartBar size={24} color={color} weight={focused ? "fill" : "regular"} /> }}
      />
    </Tabs>
  );
}
