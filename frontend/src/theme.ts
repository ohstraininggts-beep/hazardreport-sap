// Design tokens for GTS Safety Portal — "5 Brutalist Mobile" personality.
// Light + Dark themes. Keys mirror the `color` block of design_guidelines.json.
import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#FFFFFF",
  onSurface: "#111111",
  surfaceSecondary: "#F5F5F5",
  onSurfaceSecondary: "#111111",
  surfaceTertiary: "#EAEAEA",
  onSurfaceTertiary: "#111111",
  surfaceInverse: "#111111",
  onSurfaceInverse: "#F5F5F5",
  muted: "#757575",

  brand: "#F25C05",
  onBrand: "#FFFFFF",
  brandPrimary: "#F25C05",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#D14D02",
  onBrandSecondary: "#FFFFFF",
  brandTertiary: "#FFDBC7",
  onBrandTertiary: "#8A3300",

  success: "#008A27",
  onSuccess: "#FFFFFF",
  warning: "#D99000",
  onWarning: "#111111",
  error: "#D30000",
  onError: "#FFFFFF",
  info: "#4A5568",
  onInfo: "#FFFFFF",

  border: "#111111",
  borderStrong: "#111111",
  divider: "#EAEAEA",
};

export type ThemeColors = typeof light;

const dark: ThemeColors = {
  surface: "#111111",
  onSurface: "#F5F5F5",
  surfaceSecondary: "#1F1F1F",
  onSurfaceSecondary: "#F5F5F5",
  surfaceTertiary: "#2D2D2D",
  onSurfaceTertiary: "#F5F5F5",
  surfaceInverse: "#F5F5F5",
  onSurfaceInverse: "#111111",
  muted: "#9E9E9E",

  brand: "#F25C05",
  onBrand: "#FFFFFF",
  brandPrimary: "#F25C05",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#FF7A29",
  onBrandSecondary: "#111111",
  brandTertiary: "#451900",
  onBrandTertiary: "#FFDBC7",

  success: "#00B233",
  onSuccess: "#111111",
  warning: "#FFB219",
  onWarning: "#111111",
  error: "#FF3333",
  onError: "#111111",
  info: "#718096",
  onInfo: "#111111",

  border: "#333333",
  borderStrong: "#F5F5F5",
  divider: "#2D2D2D",
};

export const defaultScheme = "light" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark?: ThemeColors } = { light, dark };

// Typography families (loaded via expo-font in app/_layout.tsx)
export const fonts = {
  display: "Archivo",
  displayBold: "Archivo",
  body: "IBMPlexSans",
  mono: "IBMPlexMono",
  monoBold: "IBMPlexMonoSemiBold",
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48 };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
