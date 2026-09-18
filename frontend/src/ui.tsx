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
import { CaretDown, MagnifyingGlass, X } from "phosphor-react-native";
import { makeStyles, useTheme, fonts, ThemeColors } from "@/src/theme";
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
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: color,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontSize: 11,
          fontFamily: fonts.monoBold,
          letterSpacing: 0.5,
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
      {label ? <Text style={{ color: colors.muted, fontFamily: fonts.body }}>{label}</Text> : null}
    </View>
  );
}

export function EmptyState({ title, subtitle, testID }: { title: string; subtitle?: string; testID?: string }) {
  const { colors } = useTheme();
  return (
    <View testID={testID} style={{ alignItems: "center", justifyContent: "center", padding: 40, gap: 8 }}>
      <Text style={{ color: colors.onSurface, fontFamily: fonts.displayBold, fontWeight: "800", fontSize: 18, textAlign: "center" }}>
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
                height: 36,
                paddingHorizontal: 14,
                justifyContent: "center",
                borderWidth: 1.5,
                borderColor: colors.border,
                backgroundColor: active ? colors.brandPrimary : colors.surface,
              }}
            >
              <Text
                style={{
                  color: active ? colors.onBrandPrimary : colors.onSurface,
                  fontFamily: fonts.monoBold,
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
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
  variant?: "primary" | "dark";
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const bg = variant === "dark" ? colors.surfaceInverse : colors.brandPrimary;
  const fg = variant === "dark" ? colors.onSurfaceInverse : colors.onBrandPrimary;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderWidth: 1.5,
          borderColor: colors.border,
          paddingVertical: 16,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={{ color: fg, fontFamily: fonts.displayBold, fontWeight: "800", fontSize: 15, letterSpacing: 0.5, textTransform: "uppercase" }}>
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
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        keyboardType={keyboardType}
        style={[styles.input, multiline && { minHeight: 90, textAlignVertical: "top" }]}
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
    <View style={{ gap: 6 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable testID={testID} onPress={() => setOpen(true)} style={[styles.input, { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }]}>
        <Text style={{ color: value ? colors.onSurface : colors.muted, fontFamily: fonts.body, flex: 1 }} numberOfLines={1}>
          {value || placeholder || "Pilih..."}
        </Text>
        <CaretDown size={18} color={colors.onSurface} weight="bold" />
      </Pressable>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: colors.surface, maxHeight: "75%", borderTopWidth: 2, borderColor: colors.borderStrong }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1.5, borderColor: colors.border }}>
              <Text style={{ color: colors.onSurface, fontFamily: fonts.displayBold, fontWeight: "800", fontSize: 16 }}>{label}</Text>
              <Pressable testID={`${testID}-close`} onPress={() => setOpen(false)} hitSlop={8}>
                <X size={22} color={colors.onSurface} weight="bold" />
              </Pressable>
            </View>
            <View style={{ padding: 12 }}>
              <SearchBar value={q} onChange={setQ} placeholder="Cari..." />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              {filtered.map((o) => (
                <Pressable
                  key={o}
                  testID={`${testID}-opt-${o}`}
                  onPress={() => {
                    onSelect(o);
                    setOpen(false);
                    setQ("");
                  }}
                  style={{ paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: colors.divider, backgroundColor: o === value ? colors.brandTertiary : colors.surface }}
                >
                  <Text style={{ color: colors.onSurface, fontFamily: fonts.body }}>{o}</Text>
                </Pressable>
              ))}
              {filtered.length === 0 ? (
                <Text style={{ color: colors.muted, padding: 16, fontFamily: fonts.body }}>Tidak ada opsi.</Text>
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
    <View style={{ flexDirection: "row", borderWidth: 1.5, borderColor: colors.border }}>
      {options.map((o, i) => {
        const active = o === value;
        return (
          <Pressable
            key={o}
            testID={`${testID}-${o}`}
            onPress={() => onChange(o)}
            style={{ flex: 1, paddingVertical: 12, alignItems: "center", backgroundColor: active ? colors.brandPrimary : colors.surface, borderLeftWidth: i === 0 ? 0 : 1.5, borderColor: colors.border }}
          >
            <Text style={{ color: active ? colors.onBrandPrimary : colors.onSurface, fontFamily: fonts.monoBold, fontSize: 12, textTransform: "uppercase" }}>{o}</Text>
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
    borderWidth: 1.5,
    borderColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: { flex: 1, color: c.onSurface, fontFamily: fonts.body, fontSize: 14, paddingVertical: 0 },
  fieldLabel: { color: c.onSurface, fontFamily: fonts.monoBold, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    borderWidth: 1.5,
    borderColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: c.onSurface,
    fontFamily: fonts.body,
    fontSize: 14,
  },
}));
