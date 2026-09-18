import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Warning, ClipboardText, ChartBar, SignOut, CaretRight, HardHat, Quotes } from "phosphor-react-native";
import { useAuth } from "@/src/auth";
import { makeStyles, useTheme, fonts } from "@/src/theme";

const QUOTES = [
  { t: "Kecelakaan tidak terjadi begitu saja, melainkan akibat dari suatu rantai kegagalan atau kesalahan.", a: "H.W. Heinrich" },
  { t: "Mencegah lebih baik daripada mengobati.", a: "Benjamin Franklin" },
  { t: "Keselamatan bukanlah suatu kebetulan, melainkan hasil dari perencanaan dan tindakan yang disengaja.", a: "National Safety Council" },
  { t: "Dibutuhkan kepemimpinan untuk meningkatkan keselamatan.", a: "Jackie Stewart" },
];

export default function Beranda() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

  const modules = [
    { key: "hazard", title: "Hazard Report", desc: "Pelaporan bahaya & kondisi tidak aman", icon: Warning, route: "/(tabs)/hazard", color: colors.brandPrimary },
    { key: "inspeksi", title: "Inspeksi", desc: "Formulir & log inspeksi keselamatan", icon: ClipboardText, route: "/(tabs)/inspeksi", color: colors.surfaceInverse },
    { key: "dashboard", title: "Dashboard", desc: "Overview, statistik & monitoring", icon: ChartBar, route: "/(tabs)/dashboard", color: colors.info },
  ] as const;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.brandRow}>
            <HardHat size={18} color={colors.brandPrimary} weight="fill" />
            <Text style={styles.brandTag}>OHS & TRAINING · GTS</Text>
          </View>
          <Text style={styles.hello} numberOfLines={1}>{user?.nama || "Karyawan"}</Text>
          <Text style={styles.role} numberOfLines={1}>{user?.jabatan} · {user?.departemen}</Text>
        </View>
        <Pressable testID="logout-button" onPress={logout} style={styles.logout} hitSlop={8}>
          <SignOut size={20} color={colors.onSurface} weight="bold" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={styles.quoteCard}>
          <Quotes size={28} color={colors.brandPrimary} weight="fill" />
          <Text style={styles.quoteText}>{quote.t}</Text>
          <Text style={styles.quoteAuthor}>— {quote.a}</Text>
        </View>

        <View style={styles.statsStrip}>
          {[
            { label: "18+", sub: "Formulir" },
            { label: "AUTO", sub: "PDF" },
            { label: "REAL", sub: "Time" },
          ].map((s) => (
            <View key={s.sub} style={styles.statChip}>
              <Text style={styles.statChipTop}>{s.label}</Text>
              <Text style={styles.statChipSub}>{s.sub}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>JELAJAHI MENU</Text>
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {modules.map((m) => (
            <Pressable
              key={m.key}
              testID={`module-${m.key}`}
              onPress={() => router.push(m.route as any)}
              style={({ pressed }) => [styles.moduleCard, pressed && { opacity: 0.9 }]}
            >
              <View style={[styles.moduleIcon, { backgroundColor: m.color }]}>
                <m.icon size={28} color="#FFFFFF" weight="fill" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.moduleTitle}>{m.title}</Text>
                <Text style={styles.moduleDesc}>{m.desc}</Text>
              </View>
              <CaretRight size={22} color={colors.onSurface} weight="bold" />
            </Pressable>
          ))}
        </View>

        <View style={styles.banner}>
          <Image
            source="https://images.unsplash.com/photo-1627024165011-6a9e2c4ea343?crop=entropy&cs=srgb&fm=jpg&q=85&w=1000"
            style={{ width: "100%", height: 140 }}
            contentFit="cover"
          />
          <LinearGradient colors={["transparent", "rgba(17,17,17,0.9)"]} style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 80 }} />
          <Text style={styles.bannerText}>STOP pekerjaan jika menemukan kondisi tidak aman.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1.5, borderColor: c.border, gap: 12, backgroundColor: c.surface },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  brandTag: { color: c.muted, fontFamily: fonts.monoBold, fontSize: 10, letterSpacing: 0.8 },
  hello: { color: c.onSurface, fontFamily: fonts.displayBold, fontWeight: "900", fontSize: 22, marginTop: 4 },
  role: { color: c.muted, fontFamily: fonts.body, fontSize: 12 },
  logout: { width: 44, height: 44, borderWidth: 1.5, borderColor: c.border, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  quoteCard: { margin: 16, marginBottom: 12, padding: 18, backgroundColor: c.surfaceSecondary, borderWidth: 1.5, borderColor: c.border, gap: 8 },
  quoteText: { color: c.onSurface, fontFamily: fonts.display, fontSize: 17, lineHeight: 24, fontWeight: "700" },
  quoteAuthor: { color: c.brandPrimary, fontFamily: fonts.monoBold, fontSize: 12 },
  statsStrip: { flexDirection: "row", paddingHorizontal: 16, gap: 12 },
  statChip: { flex: 1, borderWidth: 1.5, borderColor: c.border, paddingVertical: 12, alignItems: "center", backgroundColor: c.surface },
  statChipTop: { color: c.brandPrimary, fontFamily: fonts.monoBold, fontSize: 16 },
  statChipSub: { color: c.muted, fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase" },
  sectionTitle: { color: c.onSurface, fontFamily: fonts.monoBold, fontSize: 13, letterSpacing: 1, paddingHorizontal: 16, marginTop: 22, marginBottom: 12 },
  moduleCard: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface, padding: 14 },
  moduleIcon: { width: 54, height: 54, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: c.border },
  moduleTitle: { color: c.onSurface, fontFamily: fonts.displayBold, fontWeight: "800", fontSize: 17 },
  moduleDesc: { color: c.muted, fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  banner: { margin: 16, marginTop: 22, borderWidth: 1.5, borderColor: c.border, overflow: "hidden" },
  bannerText: { position: "absolute", left: 12, right: 12, bottom: 10, color: "#FFFFFF", fontFamily: fonts.displayBold, fontWeight: "800", fontSize: 14 },
}));
