import React, { useState } from "react";
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Lightning, ShieldWarning, User, IdentificationCard } from "phosphor-react-native";
import { useAuth } from "@/src/auth";
import { makeStyles, useTheme, fonts, radii } from "@/src/theme";
import { PrimaryButton } from "@/src/ui";

const HERO = "https://images.unsplash.com/photo-1580901368919-7738efb0f87e?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400";

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
      <Image source={HERO} style={styles.bgImg} contentFit="cover" />
      <LinearGradient colors={["rgba(11,11,15,0.45)", "rgba(11,11,15,0.9)", "rgba(11,11,15,0.98)"]} style={styles.bgScrim} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }} keyboardShouldPersistTaps="handled">
          <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.hero}>
              <View style={styles.logoRow}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoText}>GTS</Text>
                </View>
                <View>
                  <Text style={styles.brandName}>PT. GANE TAMBANG SENTOSA</Text>
                  <Text style={styles.brandSub}>Site Fluk-Gambaru</Text>
                </View>
              </View>

              <View style={styles.badge}>
                <Lightning size={13} color={colors.brandPrimary} weight="fill" />
                <Text style={styles.badgeText}>Digital Safety Management Platform</Text>
              </View>
              <Text style={styles.heroTitle}>
                <Text style={{ color: colors.brandPrimary }}>Safety</Text>
                <Text style={{ color: "#FFFFFF" }}> Portal</Text>
              </Text>
              <Text style={styles.heroSub}>Masuk untuk melaporkan bahaya & inspeksi keselamatan kerja.</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Nama Karyawan</Text>
              <View style={styles.inputWrap}>
                <User size={18} color={colors.muted} weight="bold" />
                <TextInput
                  testID="login-username-input"
                  value={nama}
                  onChangeText={setNama}
                  placeholder="Nama lengkap sesuai data"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="words"
                  style={styles.input}
                />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>NIK (Password)</Text>
              <View style={styles.inputWrap}>
                <IdentificationCard size={18} color={colors.muted} weight="bold" />
                <TextInput
                  testID="login-password-input"
                  value={nik}
                  onChangeText={setNik}
                  placeholder="Masukkan NIK"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                  style={styles.input}
                />
              </View>

              {error ? (
                <View style={styles.errorBox} testID="login-error">
                  <ShieldWarning size={18} color={colors.onError} weight="fill" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={{ marginTop: 18 }}>
                <PrimaryButton testID="login-submit-button" label={busy ? "Memproses..." : "Masuk"} onPress={onSubmit} loading={busy} />
              </View>
            </View>

            <Text style={styles.footer}>© 2026 PT. Gane Tambang Sentosa — Safety First</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: "#0B0B0F" },
  bgImg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  bgScrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  content: { paddingHorizontal: 20, gap: 20 },
  hero: { gap: 8 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  logoCircle: { width: 42, height: 42, borderRadius: radii.pill, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  logoText: { color: "#FFFFFF", fontFamily: fonts.displayBold, fontSize: 14 },
  brandName: { color: "#FFFFFF", fontFamily: fonts.displayBold, fontSize: 12.5, letterSpacing: 0.2 },
  brandSub: { color: "rgba(255,255,255,0.7)", fontFamily: fonts.medium, fontSize: 11 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", paddingHorizontal: 11, paddingVertical: 6, borderRadius: radii.pill },
  badgeText: { color: "#FFFFFF", fontFamily: fonts.semibold, fontSize: 11 },
  heroTitle: { fontFamily: fonts.displayBold, fontSize: 40, lineHeight: 44, letterSpacing: -1, marginTop: 4 },
  heroSub: { color: "rgba(255,255,255,0.8)", fontFamily: fonts.body, fontSize: 13, lineHeight: 19 },
  card: { backgroundColor: c.surface, borderRadius: radii["2xl"], borderWidth: 1, borderColor: c.border, padding: 20 },
  fieldLabel: { color: c.muted, fontFamily: fonts.semibold, fontSize: 11.5, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 7 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: radii.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, paddingHorizontal: 14, height: 52 },
  input: { flex: 1, color: c.onSurface, fontFamily: fonts.body, fontSize: 15, paddingVertical: 0 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.error, padding: 12, marginTop: 14, borderRadius: radii.md },
  errorText: { color: c.onError, fontFamily: fonts.medium, fontSize: 13, flex: 1 },
  footer: { color: "rgba(255,255,255,0.6)", fontFamily: fonts.medium, fontSize: 11, textAlign: "center" },
}));
