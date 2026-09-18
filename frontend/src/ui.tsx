import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal,
  StyleProp,
  ViewStyle,
} from "react-native";
import { CaretDown, MagnifyingGlass, X, Check } from "phosphor-react-native";
import { makeStyles, useTheme, fonts, radii, ThemeColors } from "@/src/theme";
import { riskKey } from "@/src/navigation";

export function riskColor(colors: ThemeColors, t: string) {
  switch (riskKey(t)) {
    case "ekstrem":
      return colors.error;
    case "tinggi":
      return colors.brandPrimary;
    case "sedang":
      return colors.warning;
    default:
      return colors.success;
  }
}

export function statusColor(colors: ThemeColors, s: string) {
  const v = (s || "").toLowerCase();
  if (v === "close" || v === "closed" || v === "approved") return colors.success;
  if (v === "open" || v === "pending") return colors.error;
  return colors.info;
}

export function Badge({ label, color, testID }: { label: string; color: string; testID?: string }) {
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: color,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: radii.pill,
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 10.5,
          fontFamily: fonts.monoBold,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 12 }}>
      <ActivityIndicator size="large" color={colors.brandPrimary} />
      {label ? <Text style={{ color: colors.muted, fontFamily: fonts.medium }}>{label}</Text> : null}
    </View>
  );
}

export function EmptyState({ title, subtitle, testID }: { title: string; subtitle?: string; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={{ alignItems: "center", justifyContent: "center", padding: 40, gap: 8 }}>
      <Text style={{ color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 18, textAlign: "center" }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: colors.muted, fontFamily: fonts.body, textAlign: "center" }}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function ChipRow({
  options,
  value,
  onChange,
  testID,
}: {
  options: { key: string; label: string }[];
  value: string;
  onChange: (k: string) => void;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ height: 56, justifyContent: "center" }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16, alignItems: "center" }}
      >
        {options.map((o) => {
          const active = o.key === value;
          return (
            <Pressable
              key={o.key}
              testID={`${testID}-${o.key}`}
              onPress={() => onChange(o.key)}
              style={{
                flexShrink: 0,
                height: 38,
                paddingHorizontal: 16,
                justifyContent: "center",
                borderRadius: radii.pill,
                borderWidth: 1,
                borderColor: active ? colors.brandPrimary : colors.border,
                backgroundColor: active ? colors.brandPrimary : colors.surfaceSecondary,
              }}
            >
              <Text
                style={{
                  color: active ? colors.onBrandPrimary : colors.onSurface,
                  fontFamily: fonts.semibold,
                  fontSize: 12.5,
                  letterSpacing: 0.2,
                }}
              >
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function SearchBar({ value, onChange, placeholder, testID }: { value: string; onChange: (s: string) => void; placeholder?: string; testID?: string }) {
  const styles = useSharedStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.searchWrap}>
      <MagnifyingGlass size={18} color={colors.muted} weight="bold" />
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || "Cari..."}
        placeholderTextColor={colors.muted}
        style={styles.searchInput}
      />
      {value ? (
        <Pressable onPress={() => onChange("")} hitSlop={8}>
          <X size={16} color={colors.muted} weight="bold" />
        </Pressable>
      ) : null}
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  testID,
  variant = "primary",
  style,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
  variant?: "primary" | "dark" | "outline";
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const bg =
    variant === "dark" ? colors.surfaceInverse : variant === "outline" ? "transparent" : colors.brandPrimary;
  const fg =
    variant === "dark" ? colors.onSurfaceInverse : variant === "outline" ? colors.onSurface : colors.onBrandPrimary;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: radii.lg,
          borderWidth: variant === "outline" ? 1.5 : 0,
          borderColor: colors.border,
          paddingVertical: 16,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        variant === "primary" && {
          shadowColor: colors.brandPrimary,
          shadowOpacity: 0.35,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={{ color: fg, fontFamily: fonts.displayBold, fontSize: 14, letterSpacing: 1, textTransform: "uppercase" }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  testID,
  keyboardType,
}: any) {
  const styles = useSharedStyles();
  const { colors } = useTheme();
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.input, multiline && { minHeight: 96, textAlignVertical: "top" }]}
      />
    </View>
  );
}

export function SelectField({
  label,
  value,
  options,
  onSelect,
  placeholder,
  testID,
}: {
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  placeholder?: string;
  testID?: string;
}) {
  const styles = useSharedStyles();
  const { colors } = useTheme();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const filtered = options.filter((o) => o.toLowerCase().includes(q.toLowerCase()));
  return (
    <View style={{ gap: 7 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable testID={testID} onPress={() => setOpen(true)} style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
        <Text style={{ color: value ? colors.onSurface : colors.muted, fontFamily: fonts.body, flex: 1 }} numberOfLines={1}>
          {value || placeholder || "Pilih..."}
        </Text>
        <CaretDown size={18} color={colors.muted} weight="bold" />
      </Pressable>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.surface, maxHeight: "75%", borderTopLeftRadius: radii["2xl"], borderTopRightRadius: radii["2xl"], overflow: "hidden" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18, borderBottomWidth: 1, borderColor: colors.divider }}>
              <Text style={{ color: colors.onSurface, fontFamily: fonts.displayBold, fontSize: 16 }}>{label}</Text>
              <Pressable testID={`${testID}-close`} onPress={() => setOpen(false)} hitSlop={8} style={{ width: 34, height: 34, borderRadius: radii.pill, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }}>
                <X size={20} color={colors.onSurface} weight="bold" />
              </Pressable>
            </View>
            <View style={{ padding: 12 }}>
              <SearchBar value={q} onChange={setQ} placeholder="Cari..." />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              {filtered.map((o) => {
                const sel = o === value;
                return (
                  <Pressable
                    key={o}
                    testID={`${testID}-opt-${o}`}
                    onPress={() => {
                      onSelect(o);
                      setOpen(false);
                      setQ("");
                    }}
                    style={{ paddingVertical: 15, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: sel ? colors.brandTertiary : "transparent" }}
                  >
                    <Text style={{ color: colors.onSurface, fontFamily: sel ? fonts.semibold : fonts.body, flex: 1 }}>{o}</Text>
                    {sel ? <Check size={18} color={colors.brandPrimary} weight="bold" /> : null}
                  </Pressable>
                );
              })}
              {filtered.length === 0 ? (
                <Text style={{ color: colors.muted, padding: 18, fontFamily: fonts.body }}>Tidak ada opsi.</Text>
              ) : null}
              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function Segmented({ options, value, onChange, testID }: { options: string[]; value: string; onChange: (v: string) => void; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", backgroundColor: colors.surfaceSecondary, borderRadius: radii.md, padding: 4, gap: 4 }}>
      {options.map((o) => {
        const active = o === value;
        return (
          <Pressable
            key={o}
            testID={`${testID}-${o}`}
            onPress={() => onChange(o)}
            style={{ flex: 1, paddingVertical: 11, alignItems: "center", borderRadius: radii.sm, backgroundColor: active ? colors.brandPrimary : "transparent" }}
          >
            <Text style={{ color: active ? colors.onBrandPrimary : colors.muted, fontFamily: fonts.semibold, fontSize: 12.5 }}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useSharedStyles = makeStyles((c) => ({
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceSecondary,
    paddingHorizontal: 14,
    height: 48,
  },
  searchInput: { flex: 1, color: c.onSurface, fontFamily: fonts.body, fontSize: 14, paddingVertical: 0 },
  fieldLabel: { color: c.muted, fontFamily: fonts.semibold, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.6 },
  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceSecondary,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: c.onSurface,
    fontFamily: fonts.body,
    fontSize: 14,
  },
}));
