import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { HardHat, ShieldWarning } from "phosphor-react-native";
import { useAuth } from "@/src/auth";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { PrimaryButton } from "@/src/ui";

const HERO = "https://images.unsplash.com/photo-1655549136009-6aa6ff5de57e?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200";

export default function Login() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!nama.trim() || !nik.trim()) {
      setError("Nama Karyawan dan NIK wajib diisi.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await login(nama.trim(), nik.trim());
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.message || "Gagal masuk.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Image source={HERO} style={styles.heroImg} contentFit="cover" />
            <LinearGradient
              colors={["rgba(17,17,17,0.2)", "rgba(17,17,17,0.95)"]}
              style={styles.scrim}
            />
            <View style={[styles.heroContent, { paddingTop: insets.top + 24 }]}>
              <View style={styles.badgeRow}>
                <HardHat size={22} color="#F25C05" weight="fill" />
                <Text style={styles.brandTag}>PT. GANE TAMBANG SENTOSA</Text>
              </View>
              <Text style={styles.heroTitle}>SAFETY{"\n"}FIRST</Text>
              <Text style={styles.heroSub}>OHS & Training · Digital Safety Platform</Text>
            </View>
          </View>

          <View style={styles.form}>
            <Text style={styles.formLabel}>NAMA KARYAWAN</Text>
            <TextInput
              testID="login-username-input"
              value={nama}
              onChangeText={setNama}
              placeholder="Nama lengkap sesuai data"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              style={styles.input}
            />
            <Text style={styles.formLabel}>NIK (PASSWORD)</Text>
            <TextInput
              testID="login-password-input"
              value={nik}
              onChangeText={setNik}
              placeholder="Masukkan NIK"
              placeholderTextColor={colors.muted}
              autoCapitalize="characters"
              style={styles.input}
            />
            {error ? (
              <View style={styles.errorBox} testID="login-error">
                <ShieldWarning size={18} color={colors.onError} weight="fill" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <PrimaryButton testID="login-submit-button" label={busy ? "Memproses..." : "Masuk"} onPress={onSubmit} loading={busy} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  hero: { height: 320, backgroundColor: "#111111" },
  heroImg: { ...StyleSheetAbsolute() },
  scrim: { ...StyleSheetAbsolute() },
  heroContent: { flex: 1, justifyContent: "flex-end", padding: 20, gap: 6 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandTag: { color: "#FFFFFF", fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 1 },
  heroTitle: { color: "#FFFFFF", fontFamily: fonts.displayBold, fontWeight: "900", fontSize: 52, lineHeight: 52, letterSpacing: -1 },
  heroSub: { color: "#F25C05", fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 0.5 },
  form: { padding: 20, gap: 8 },
  formLabel: { color: c.onSurface, fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 0.6, marginTop: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: c.onSurface,
    fontFamily: fonts.body,
    fontSize: 16,
  },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.error, padding: 12, marginTop: 12, borderWidth: 1.5, borderColor: c.border },
  errorText: { color: c.onError, fontFamily: fonts.body, fontSize: 13, flex: 1 },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1.5, borderColor: c.border, backgroundColor: c.surface },
}));

function StyleSheetAbsolute() {
  return { position: "absolute" as const, top: 0, left: 0, right: 0, bottom: 0 };
}
