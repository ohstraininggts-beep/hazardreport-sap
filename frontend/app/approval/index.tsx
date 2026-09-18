import React, { useState } from "react";
import { View, Text, Pressable, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, SealCheck, User, MapPin, CheckCircle, Buildings } from "phosphor-react-native";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { makeStyles, useTheme, fonts, radii } from "@/src/theme";
import { Badge, ChipRow, Loading, EmptyState, statusColor } from "@/src/ui";

const STATUS = [
  { key: "Pending", label: "Menunggu" },
  { key: "Approved", label: "Disetujui" },
];

export default function ApprovalScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [status, setStatus] = useState("Pending");
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["approvals", status],
    queryFn: () => api.approvals(`?status=${status}`),
  });

  const mut = useMutation({
    mutationFn: (id: number) => api.approveInspection(id, "Approved"),
    onMutate: (id: number) => setApprovingId(id),
    onSettled: () => setApprovingId(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      qc.invalidateQueries({ queryKey: ["inspections"] });
    },
  });

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="back-button" onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.onSurface} weight="bold" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>APPROVAL INSPEKSI</Text>
          <View style={styles.scopeRow}>
            <Buildings size={12} color={colors.muted} weight="bold" />
            <Text style={styles.scope} numberOfLines={1}>{data?.scope || (user?.is_admin ? "Semua Departemen" : user?.approver_dept || user?.departemen)}</Text>
          </View>
        </View>
        <View style={styles.roleBadge}>
          <SealCheck size={13} color={colors.onBrandPrimary} weight="fill" />
          <Text style={styles.roleText}>{user?.is_admin ? "MASTER" : "ATASAN"}</Text>
        </View>
      </View>

      <View style={styles.chips}>
        <ChipRow testID="approval-status" options={STATUS} value={status} onChange={setStatus} />
      </View>

      {isLoading ? (
        <Loading label="Memuat data approval..." />
      ) : (
        <FlatList
          data={data?.items || []}
          keyExtractor={(i) => String(i.id)}
          contentContainerStyle={{ padding: 14, paddingBottom: insets.bottom + 24, gap: 12 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.brandPrimary} />}
          ListEmptyComponent={<EmptyState title={status === "Pending" ? "Tidak ada yang menunggu" : "Belum ada yang disetujui"} subtitle="Data inspeksi akan muncul di sini." />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Pressable onPress={() => router.push(`/inspeksi/${item.id}`)}>
                <View style={styles.badgeRow}>
                  <Badge label={item.status} color={statusColor(colors, item.status)} />
                  <Text style={styles.code}>{item.form_code}</Text>
                </View>
                <Text style={styles.jenis} numberOfLines={2}>{item.jenis || item.form_title}</Text>
                <View style={styles.metaRow}><User size={12} color={colors.muted} weight="bold" /><Text style={styles.meta} numberOfLines={1}>{item.pelaksana} · {item.departemen}</Text></View>
                <View style={styles.metaRow}><MapPin size={12} color={colors.muted} weight="bold" /><Text style={styles.meta} numberOfLines={1}>{item.area || "-"} · {item.tanggal}</Text></View>
              </Pressable>
              {item.status.toLowerCase() === "pending" ? (
                <Pressable
                  testID={`approve-${item.id}`}
                  onPress={() => mut.mutate(item.id)}
                  disabled={approvingId === item.id}
                  style={[styles.approveBtn, approvingId === item.id && { opacity: 0.6 }]}
                >
                  <CheckCircle size={16} color="#FFFFFF" weight="fill" />
                  <Text style={styles.approveText}>{approvingId === item.id ? "MEMPROSES..." : "SETUJUI (APPROVE)"}</Text>
                </Pressable>
              ) : (
                <View style={styles.approvedInfo}>
                  <CheckCircle size={14} color={colors.success} weight="fill" />
                  <Text style={styles.approvedText}>Disetujui oleh {item.approved_by || "-"} · {item.approved_at || ""}</Text>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderColor: c.divider, backgroundColor: c.surface },
  backBtn: { width: 36, height: 36, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  headerTitle: { color: c.onSurface, fontFamily: fonts.displayBold, fontSize: 15 },
  scopeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  scope: { color: c.muted, fontFamily: fonts.medium, fontSize: 11 },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: c.brandPrimary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.pill },
  roleText: { color: c.onBrandPrimary, fontFamily: fonts.displayBold, fontSize: 10, letterSpacing: 0.4 },
  chips: { borderBottomWidth: 1, borderColor: c.divider, backgroundColor: c.surfaceSecondary },
  card: { borderRadius: radii.lg, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, padding: 12, gap: 7 },
  badgeRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  code: { color: c.muted, fontFamily: fonts.medium, fontSize: 10 },
  jenis: { color: c.onSurface, fontFamily: fonts.displayBold, fontSize: 13.5, lineHeight: 18 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: { color: c.muted, fontFamily: fonts.body, fontSize: 11.5, flex: 1 },
  approveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: c.success, borderRadius: radii.md, paddingVertical: 11, marginTop: 4 },
  approveText: { color: "#FFFFFF", fontFamily: fonts.displayBold, fontSize: 12, letterSpacing: 0.5 },
  approvedInfo: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4, paddingVertical: 6 },
  approvedText: { color: c.success, fontFamily: fonts.medium, fontSize: 11.5, flex: 1 },
}));
