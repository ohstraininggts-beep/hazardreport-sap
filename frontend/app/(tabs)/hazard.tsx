import React, { useState } from "react";
import { View, Text, Pressable, FlatList, RefreshControl } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Plus, MapPin, User, Warning } from "phosphor-react-native";
import { api } from "@/src/api";
import { usesNativeTabs } from "@/src/navigation";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { Badge, ChipRow, SearchBar, Loading, EmptyState, riskColor, statusColor } from "@/src/ui";

const STATUS = [
  { key: "", label: "Semua" },
  { key: "Open", label: "Open" },
  { key: "Close", label: "Close" },
];
const RISK = [
  { key: "", label: "Semua Resiko" },
  { key: "Rendah", label: "Rendah" },
  { key: "Sedang", label: "Sedang" },
  { key: "Tinggi", label: "Tinggi" },
  { key: "Ekstrem", label: "Ekstrem" },
];

export default function HazardList() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [risk, setRisk] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const qs = `?limit=60${status ? `&status=${status}` : ""}${risk ? `&tingkat=${risk}` : ""}${debounced ? `&search=${encodeURIComponent(debounced)}` : ""}`;
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["hazards", status, risk, debounced],
    queryFn: () => api.hazards(qs),
  });

  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>HAZARD REPORT</Text>
        <Text style={styles.subtitle}>{data ? `${data.total} laporan` : "Memuat data laporan"}</Text>
        <View style={{ paddingHorizontal: 0, marginTop: 12 }}>
          <SearchBar testID="hazard-search" value={search} onChange={setSearch} placeholder="Cari deskripsi, lokasi, observer..." />
        </View>
      </View>
      <View style={styles.chips}>
        <ChipRow testID="hazard-status" options={STATUS} value={status} onChange={setStatus} />
      </View>
      <View style={[styles.chips, { borderTopWidth: 0 }]}>
        <ChipRow testID="hazard-risk" options={RISK} value={risk} onChange={setRisk} />
      </View>

      {isLoading ? (
        <Loading label="Mengambil data..." />
      ) : (
        <FlatList
          data={data?.items || []}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomChrome + 96, gap: 12 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brandPrimary} />}
          ListEmptyComponent={<EmptyState testID="hazard-empty" title="Tidak ada laporan" subtitle="Belum ada hazard report yang cocok dengan filter." />}
          renderItem={({ item }) => (
            <Pressable
              testID={`hazard-card-${item.id}`}
              onPress={() => router.push(`/hazard/${item.id}`)}
              style={[styles.card, { borderLeftWidth: 6, borderLeftColor: riskColor(colors, item.tingkat_resiko) }]}
            >
              <View style={styles.cardBody}>
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={styles.badgeRow}>
                    <Badge label={item.tingkat_resiko || "-"} color={riskColor(colors, item.tingkat_resiko)} />
                    <Badge label={item.status} color={statusColor(colors, item.status)} />
                  </View>
                  <Text style={styles.desc} numberOfLines={2}>{item.deskripsi}</Text>
                  <View style={styles.metaRow}>
                    <MapPin size={13} color={colors.muted} weight="bold" />
                    <Text style={styles.meta} numberOfLines={1}>{item.lokasi || "-"}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <User size={13} color={colors.muted} weight="bold" />
                    <Text style={styles.meta} numberOfLines={1}>{item.observer} · {item.departemen}</Text>
                  </View>
                </View>
                {item.foto_sebelum ? (
                  <Image source={item.foto_sebelum} style={styles.thumb} contentFit="cover" transition={150} />
                ) : (
                  <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Warning size={22} color={colors.muted} weight="bold" />
                  </View>
                )}
              </View>
              <Text style={styles.date}>{item.tanggal} · {item.waktu}</Text>
            </Pressable>
          )}
        />
      )}

      <Pressable
        testID="hazard-create-fab"
        onPress={() => router.push("/hazard/create")}
        style={[styles.fab, { bottom: bottomChrome + 16 }]}
      >
        <Plus size={20} color={colors.onBrandPrimary} weight="bold" />
        <Text style={styles.fabText}>BUAT LAPORAN</Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1.5, borderColor: c.border, backgroundColor: c.surface },
  title: { color: c.onSurface, fontFamily: fonts.displayBold, fontWeight: "900", fontSize: 26, letterSpacing: -0.5 },
  subtitle: { color: c.muted, fontFamily: fonts.mono, fontSize: 12, marginTop: 2 },
  chips: { borderBottomWidth: 1.5, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  card: { borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface, padding: 12, gap: 8 },
  cardBody: { flexDirection: "row", gap: 12 },
  badgeRow: { flexDirection: "row", gap: 6 },
  desc: { color: c.onSurface, fontFamily: fonts.body, fontSize: 15, fontWeight: "600", lineHeight: 20 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { color: c.muted, fontFamily: fonts.body, fontSize: 12, flex: 1 },
  thumb: { width: 76, height: 76, borderWidth: 1.5, borderColor: c.border },
  thumbPlaceholder: { alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  date: { color: c.muted, fontFamily: fonts.mono, fontSize: 11, borderTopWidth: 1, borderColor: c.divider, paddingTop: 6 },
  fab: { position: "absolute", right: 16, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.brandPrimary, borderWidth: 1.5, borderColor: c.border, paddingHorizontal: 18, paddingVertical: 14 },
  fabText: { color: c.onBrandPrimary, fontFamily: fonts.displayBold, fontWeight: "800", fontSize: 13, letterSpacing: 0.5 },
}));
