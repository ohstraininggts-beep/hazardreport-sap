// Design tokens for GTS Safety Portal — matched to the Zite web apps
// (inspection-gts.zite.so & sap-hazardreport.zite.so).
// Modern rounded UI · Plus Jakarta Sans · dark-first with manual light toggle.
import { useMemo, useSyncExternalStore } from "react";
import { StyleSheet, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ColorScheme = "light" | "dark";
export type ThemePref = "light" | "dark" | "system";

const light = {
  surface: "#FFFFFF",
  onSurface: "#15151B",
  surfaceSecondary: "#F5F5F8",
  onSurfaceSecondary: "#15151B",
  surfaceTertiary: "#ECECF1",
  onSurfaceTertiary: "#15151B",
  surfaceInverse: "#15151B",
  onSurfaceInverse: "#FFFFFF",
  muted: "#71717A",

  brand: "#FF3B30",
  onBrand: "#FFFFFF",
  brandPrimary: "#FF3B30",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#E11D2E",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#FFE4E1",
  onBrandTertiary: "#8A1A12",

  success: "#16A34A",
  onSuccess: "#FFFFFF",
  warning: "#D97706",
  onWarning: "#FFFFFF",
  error: "#DC2626",
  onError: "#FFFFFF",
  info: "#2563EB",
  onInfo: "#FFFFFF",

  border: "#E4E4EA",
  borderStrong: "#CACAD2",
  divider: "#EEEEF2",
};

export type ThemeColors = typeof light;

const dark: ThemeColors = {
  surface: "#0B0B0F",
  onSurface: "#F4F4F7",
  surfaceSecondary: "#17171D",
  onSurfaceSecondary: "#F4F4F7",
  surfaceTertiary: "#22222A",
  onSurfaceTertiary: "#F4F4F7",
  surfaceInverse: "#F4F4F7",
  onSurfaceInverse: "#0B0B0F",
  muted: "#8E8E9A",

  brand: "#FF3B30",
  onBrand: "#FFFFFF",
  brandPrimary: "#FF3B30",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FF6B5E",
  onBrandSecondary: "#0B0B0F",
  brandTertiary: "#3A1512",
  onBrandTertiary: "#FFC9C4",

  success: "#22C55E",
  onSuccess: "#FFFFFF",
  warning: "#F59E0B",
  onWarning: "#111111",
  error: "#EF4444",
  onError: "#FFFFFF",
  info: "#3B82F6",
  onInfo: "#FFFFFF",

  border: "#26262E",
  borderStrong: "#3A3A44",
  divider: "#1E1E25",
};

export const themes: { light: ThemeColors; dark: ThemeColors } = { light, dark };

// Typography families (loaded via expo-font in app/_layout.tsx)
export const fonts = {
  display: "PlusJakartaExtraBold",
  displayBold: "PlusJakartaExtraBold",
  heading: "PlusJakartaBold",
  body: "PlusJakartaRegular",
  medium: "PlusJakartaMedium",
  semibold: "PlusJakartaSemiBold",
  // legacy aliases kept so existing screens keep working
  mono: "PlusJakartaSemiBold",
  monoBold: "PlusJakartaBold",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48 };
export const radii = { sm: 10, md: 14, lg: 18, xl: 24, "2xl": 28, pill: 999 };

// ---------------------------------------------------------------------------
// Manual theme preference store (dark-first) with AsyncStorage persistence.
// Uses an external store so every useTheme() consumer re-renders on toggle
// without needing a Provider wrapper.
// ---------------------------------------------------------------------------
const PREF_KEY = "gts_theme_pref";
let _pref: ThemePref = "dark";
const _listeners = new Set<() => void>();

function _emit() {
  _listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

function getSnapshot(): ThemePref {
  return _pref;
}

export function setThemePref(pref: ThemePref) {
  _pref = pref;
  _emit();
  AsyncStorage.setItem(PREF_KEY, pref).catch(() => {});
}

export function toggleTheme(current: ColorScheme) {
  setThemePref(current === "dark" ? "light" : "dark");
}

// Load persisted preference on startup.
(async () => {
  try {
    const v = (await AsyncStorage.getItem(PREF_KEY)) as ThemePref | null;
    if (v === "light" || v === "dark" || v === "system") {
      _pref = v;
      _emit();
    }
  } catch {
    // ignore
  }
})();

export function useThemePref(): ThemePref {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors; pref: ThemePref } {
  const pref = useThemePref();
  const system = useColorScheme();
  const scheme: ColorScheme = pref === "system" ? (system ?? "dark") : pref;
  return { scheme, colors: themes[scheme], pref };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
