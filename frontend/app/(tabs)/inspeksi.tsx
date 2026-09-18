import React, { useState } from "react";
import { View, Text, Pressable, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Plus, MapPin, User, ListChecks } from "phosphor-react-native";
import { api } from "@/src/api";
import { usesNativeTabs } from "@/src/navigation";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { Badge, ChipRow, SearchBar, Loading, EmptyState, statusColor } from "@/src/ui";

const STATUS = [
  { key: "", label: "Semua" },
  { key: "Approved", label: "Approved" },
  { key: "Pending", label: "Pending" },
];

export default function InspeksiList() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const qs = `?limit=60${status ? `&status=${status}` : ""}${debounced ? `&search=${encodeURIComponent(debounced)}` : ""}`;
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["inspections", status, debounced],
    queryFn: () => api.inspections(qs),
  });

  const bottomChrome = usesNativeTabs ? insets.bottom : 0;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>INSPEKSI</Text>
        <Text style={styles.subtitle}>{data ? `${data.total} inspeksi` : "Memuat data inspeksi"}</Text>
        <View style={{ marginTop: 12 }}>
          <SearchBar testID="insp-search" value={search} onChange={setSearch} placeholder="Cari jenis, pelaksana, area..." />
        </View>
      </View>
      <View style={styles.chips}>
        <ChipRow testID="insp-status" options={STATUS} value={status} onChange={setStatus} />
      </View>

      {isLoading ? (
        <Loading label="Mengambil data..." />
      ) : (
        <FlatList
          data={data?.items || []}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 16, paddingBottom: bottomChrome + 96, gap: 12 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brandPrimary} />}
          ListEmptyComponent={<EmptyState testID="insp-empty" title="Tidak ada inspeksi" subtitle="Belum ada inspeksi yang cocok." />}
          renderItem={({ item }) => (
            <Pressable testID={`insp-card-${item.id}`} onPress={() => router.push(`/inspeksi/${item.id}`)} style={styles.card}>
              <View style={styles.badgeRow}>
                <Badge label={item.status} color={statusColor(colors, item.status)} />
                <View style={styles.countPill}>
                  <ListChecks size={13} color={colors.onSurface} weight="bold" />
                  <Text style={styles.countText}>{item.row_count} item</Text>
                </View>
              </View>
              <Text style={styles.jenis} numberOfLines={2}>{item.jenis || item.form_title || "Inspeksi"}</Text>
              {item.area ? (
                <View style={styles.metaRow}>
                  <MapPin size={13} color={colors.muted} weight="bold" />
                  <Text style={styles.meta} numberOfLines={1}>{item.area}</Text>
                </View>
              ) : null}
              <View style={styles.metaRow}>
                <User size={13} color={colors.muted} weight="bold" />
                <Text style={styles.meta} numberOfLines={1}>{item.pelaksana} · {item.departemen}</Text>
              </View>
              <Text style={styles.date}>{item.tanggal} · Shift {item.shift}</Text>
            </Pressable>
          )}
        />
      )}

      <Pressable testID="insp-create-fab" onPress={() => router.push("/inspeksi/create")} style={[styles.fab, { bottom: bottomChrome + 16 }]}>
        <Plus size={20} color={colors.onBrandPrimary} weight="bold" />
        <Text style={styles.fabText}>BUAT INSPEKSI</Text>
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
  card: { borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface, padding: 14, gap: 8 },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  countPill: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: c.border, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: c.surfaceSecondary },
  countText: { color: c.onSurface, fontFamily: fonts.mono, fontSize: 11 },
  jenis: { color: c.onSurface, fontFamily: fonts.displayBold, fontWeight: "800", fontSize: 16, lineHeight: 21 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { color: c.muted, fontFamily: fonts.body, fontSize: 12, flex: 1 },
  date: { color: c.muted, fontFamily: fonts.mono, fontSize: 11, borderTopWidth: 1, borderColor: c.divider, paddingTop: 6 },
  fab: { position: "absolute", right: 16, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: c.brandPrimary, borderWidth: 1.5, borderColor: c.border, paddingHorizontal: 18, paddingVertical: 14 },
  fabText: { color: c.onBrandPrimary, fontFamily: fonts.displayBold, fontWeight: "800", fontSize: 13, letterSpacing: 0.5 },
}));
