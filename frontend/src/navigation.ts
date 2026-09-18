import { Platform } from "react-native";

// iOS 26+ gets NativeTabs (liquid glass); everything else uses the classic JS tab bar.
export const usesNativeTabs =
  Platform.OS === "ios" && parseInt(String(Platform.Version), 10) >= 26;

export function riskKey(t: string) {
  const s = (t || "").toLowerCase();
  if (s.includes("ekstrem")) return "ekstrem";
  if (s.includes("tinggi")) return "tinggi";
  if (s.includes("sedang")) return "sedang";
  return "rendah";
}
