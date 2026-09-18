import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Warning,
  ClipboardText,
  ChartBar,
  SignOut,
  CaretRight,
  Lightning,
  Quotes,
  Sun,
  MoonStars,
  FilePdf,
  EnvelopeSimple,
  Broadcast,
  SealCheck,
} from "phosphor-react-native";
import { useAuth } from "@/src/auth";
import { makeStyles, useTheme, fonts, radii, toggleTheme } from "@/src/theme";
import { Marquee } from "@/src/components/Marquee";

const HERO = "https://images.unsplash.com/photo-1580901368919-7738efb0f87e?crop=entropy&cs=srgb&fm=jpg&q=85&w=1400";

const QUOTES = [
  { t: "Kecelakaan tidak terjadi begitu saja, melainkan akibat dari suatu rantai kegagalan atau kesalahan.", a: "H.W. Heinrich" },
  { t: "Mencegah lebih baik daripada mengobati.", a: "Benjamin Franklin" },
  { t: "Keselamatan bukanlah suatu kebetulan, melainkan hasil dari perencanaan, komando, dan tindakan yang disengaja.", a: "National Safety Council" },
  { t: "Dibutuhkan kepemimpinan untuk meningkatkan keselamatan.", a: "Jackie Stewart" },
  { t: "Perhatikan orang-orangnya, dan mereka akan memperhatikan bisnisnya.", a: "John C. Maxwell" },
];

const TIPS =
  "⚠️ Selalu gunakan APD lengkap sebelum memasuki area tambang — helm, sepatu safety, rompi, kacamata, dan sarung tangan.     •     🚧 Jangan mendekati tepi pit tanpa pengaman — jaga jarak aman minimal 5 meter.     •     ⛏️ Periksa kondisi alat berat sebelum dioperasikan.     •     ⚡ Jangan menyentuh kabel listrik terkelupas tanpa izin & pelatihan khusus.     •     🛑 STOP pekerjaan jika menemukan kondisi tidak aman — laporkan segera ke tim HSE.";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  return { date, time };
}

export default function Beranda() {
  const styles = useStyles();
  const { colors, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { date, time } = useClock();

  const [qi, setQi] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setQi((v) => (v + 1) % QUOTES.length), 6000);
    return () => clearInterval(id);
  }, []);
  const quote = QUOTES[qi];

  const modules = useMemo(() => {
    const base: any[] = [
      { key: "hazard", title: "Hazard Report", desc: "Pelaporan bahaya & kondisi tidak aman", icon: Warning, route: "/(tabs)/hazard", color: colors.brandPrimary },
      { key: "inspeksi", title: "Inspeksi", desc: "Formulir & log inspeksi keselamatan", icon: ClipboardText, route: "/(tabs)/inspeksi", color: colors.info },
      { key: "dashboard", title: "Dashboard", desc: "Overview, statistik & monitoring", icon: ChartBar, route: "/(tabs)/dashboard", color: colors.success },
    ];
    if (user?.is_approver || user?.is_admin) {
      base.splice(2, 0, { key: "approval", title: "Approval Inspeksi", desc: user?.is_admin ? "Approve semua departemen (Master)" : "Approve inspeksi departemen Anda", icon: SealCheck, route: "/approval", color: colors.warning });
    }
    return base;
  }, [colors, user]);

  const features = [
    { icon: FilePdf, label: "Auto PDF" },
    { icon: EnvelopeSimple, label: "Email Notif" },
    { icon: Broadcast, label: "Real-time" },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>GTS</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandName} numberOfLines={1}>PT. GANE TAMBANG SENTOSA</Text>
          <Text style={styles.brandSub} numberOfLines={1}>Site Fluk-Gambaru</Text>
        </View>
        <Pressable testID="theme-toggle" onPress={() => toggleTheme(scheme)} style={styles.iconBtn} hitSlop={6}>
          {scheme === "dark" ? <Sun size={18} color={colors.onSurface} weight="bold" /> : <MoonStars size={18} color={colors.onSurface} weight="bold" />}
        </Pressable>
        <Pressable testID="logout-button" onPress={logout} style={styles.iconBtn} hitSlop={6}>
          <SignOut size={18} color={colors.onSurface} weight="bold" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        {/* Live clock strip */}
        <View style={styles.clockStrip}>
          <Text style={styles.clockDate}>{date}</Text>
          <View style={styles.clockTimeWrap}>
            <Text style={styles.clockTime}>{time}</Text>
            <Text style={styles.clockTz}>WIT</Text>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Image source={HERO} style={styles.heroImg} contentFit="cover" />
          <LinearGradient colors={["rgba(11,11,15,0.55)", "rgba(11,11,15,0.92)"]} style={styles.heroScrim} />
          <View style={styles.heroContent}>
            <View style={styles.badge}>
              <Lightning size={13} color={colors.brandPrimary} weight="fill" />
              <Text style={styles.badgeText}>Digital Safety Management Platform</Text>
            </View>
            <Text style={styles.heroWelcome}>Selamat Datang di Portal</Text>
            <Text style={styles.heroTitle}>
              <Text style={{ color: colors.brandPrimary }}>OHS</Text>
              <Text style={{ color: "#FFFFFF" }}> & Training</Text>
            </Text>
            <Text style={styles.heroDesc}>
              Sistem digitalisasi pelaporan keselamatan kerja terintegrasi untuk memastikan lingkungan kerja yang aman dan produktif.
            </Text>
            <View style={styles.featureRow}>
              {features.map((f) => (
                <View key={f.label} style={styles.featureChip}>
                  <f.icon size={13} color="#FFFFFF" weight="bold" />
                  <Text style={styles.featureText}>{f.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Rotating quote */}
        <View style={styles.quoteCard}>
          <View style={styles.quoteAccent} />
          <View style={{ flex: 1, gap: 8 }}>
            <Quotes size={22} color={colors.brandPrimary} weight="fill" />
            <Text style={styles.quoteText}>{quote.t}</Text>
            <Text style={styles.quoteAuthor}>— {quote.a}</Text>
          </View>
        </View>

        {/* Menu */}
        <Text style={styles.sectionTitle}>Jelajahi Menu</Text>
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {modules.map((m) => (
            <Pressable
              key={m.key}
              testID={`module-${m.key}`}
              onPress={() => router.push(m.route as any)}
              style={({ pressed }) => [styles.moduleCard, pressed && { transform: [{ scale: 0.99 }], opacity: 0.95 }]}
            >
              <View style={[styles.moduleIcon, { backgroundColor: m.color }]}>
                <m.icon size={24} color="#FFFFFF" weight="fill" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.moduleTitle}>{m.title}</Text>
                <Text style={styles.moduleDesc}>{m.desc}</Text>
              </View>
              <View style={styles.moduleArrow}>
                <CaretRight size={18} color={colors.onSurface} weight="bold" />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Marquee tips */}
        <View style={styles.tickerWrap}>
          <View style={styles.tickerTag}>
            <Warning size={13} color={colors.onBrandPrimary} weight="fill" />
            <Text style={styles.tickerTagText}>SAFETY</Text>
          </View>
          <Marquee text={TIPS} color={colors.onSurface} speed={55} fontSize={12.5} style={{ flex: 1 }} />
        </View>

        <Text style={styles.footer}>© 2026 PT. Gane Tambang Sentosa — Safety First</Text>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 10, backgroundColor: c.surface, borderBottomWidth: 1, borderColor: c.divider },
  logoCircle: { width: 40, height: 40, borderRadius: radii.pill, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  logoText: { color: "#FFFFFF", fontFamily: fonts.displayBold, fontSize: 13, letterSpacing: 0.5 },
  brandName: { color: c.onSurface, fontFamily: fonts.displayBold, fontSize: 13, letterSpacing: 0.2 },
  brandSub: { color: c.muted, fontFamily: fonts.medium, fontSize: 11, marginTop: 1 },
  iconBtn: { width: 38, height: 38, borderRadius: radii.pill, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" },

  clockStrip: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 10 },
  clockDate: { color: c.muted, fontFamily: fonts.medium, fontSize: 12.5 },
  clockTimeWrap: { flexDirection: "row", alignItems: "baseline", gap: 5 },
  clockTime: { color: c.onSurface, fontFamily: fonts.displayBold, fontSize: 15, letterSpacing: 1 },
  clockTz: { color: c.brandPrimary, fontFamily: fonts.semibold, fontSize: 10.5 },

  hero: { margin: 16, marginTop: 4, height: 300, borderRadius: radii["2xl"], overflow: "hidden", backgroundColor: "#0B0B0F" },
  heroImg: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  heroScrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  heroContent: { flex: 1, justifyContent: "flex-end", padding: 20, gap: 8 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", paddingHorizontal: 11, paddingVertical: 6, borderRadius: radii.pill },
  badgeText: { color: "#FFFFFF", fontFamily: fonts.semibold, fontSize: 11 },
  heroWelcome: { color: "rgba(255,255,255,0.85)", fontFamily: fonts.medium, fontSize: 13, marginTop: 2 },
  heroTitle: { fontFamily: fonts.displayBold, fontSize: 34, lineHeight: 38, letterSpacing: -0.5 },
  heroDesc: { color: "rgba(255,255,255,0.8)", fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18 },
  featureRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  featureChip: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.1)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill },
  featureText: { color: "#FFFFFF", fontFamily: fonts.semibold, fontSize: 11 },

  quoteCard: { flexDirection: "row", marginHorizontal: 16, marginBottom: 4, padding: 16, gap: 14, backgroundColor: c.surfaceSecondary, borderRadius: radii.xl, borderWidth: 1, borderColor: c.border, overflow: "hidden" },
  quoteAccent: { width: 4, borderRadius: radii.pill, backgroundColor: c.warning },
  quoteText: { color: c.onSurface, fontFamily: fonts.semibold, fontSize: 15, lineHeight: 22, fontStyle: "italic" },
  quoteAuthor: { color: c.brandPrimary, fontFamily: fonts.semibold, fontSize: 12 },

  sectionTitle: { color: c.onSurface, fontFamily: fonts.displayBold, fontSize: 18, paddingHorizontal: 16, marginTop: 22, marginBottom: 12 },
  moduleCard: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: radii.xl, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, padding: 14 },
  moduleIcon: { width: 52, height: 52, borderRadius: radii.lg, alignItems: "center", justifyContent: "center" },
  moduleTitle: { color: c.onSurface, fontFamily: fonts.displayBold, fontSize: 16 },
  moduleDesc: { color: c.muted, fontFamily: fonts.body, fontSize: 12, marginTop: 2 },
  moduleArrow: { width: 32, height: 32, borderRadius: radii.pill, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" },

  tickerWrap: { flexDirection: "row", alignItems: "center", marginTop: 24, marginHorizontal: 16, height: 42, borderRadius: radii.md, backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border, overflow: "hidden" },
  tickerTag: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: c.brandPrimary, paddingHorizontal: 12, height: "100%" },
  tickerTagText: { color: c.onBrandPrimary, fontFamily: fonts.displayBold, fontSize: 11, letterSpacing: 0.5 },

  footer: { color: c.muted, fontFamily: fonts.medium, fontSize: 11, textAlign: "center", marginTop: 22 },
}));
