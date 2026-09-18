import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { ArrowLeft, FilePdf } from "phosphor-react-native";
import { api } from "@/src/api";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { Badge, Loading, statusColor } from "@/src/ui";

function Row({ label, value }: { label: string; value?: string }) {
  const styles = useStyles();
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function InspectionDetail() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: x, isLoading } = useQuery({ queryKey: ["inspection", id], queryFn: () => api.inspection(Number(id)) });

  const cols: { key: string; label: string }[] = x?.columns || [];

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="back-button" onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>DETAIL INSPEKSI</Text>
      </View>

      {isLoading || !x ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + (x.pdf ? 100 : 24) }}>
          <View style={{ padding: 16, gap: 10 }}>
            <Badge label={x.status} color={statusColor(colors, x.status)} />
            <Text style={styles.jenis}>{x.jenis || x.form_title}</Text>
            {x.form_code ? <Text style={styles.code}>{x.form_code}</Text> : null}
          </View>

          <View style={styles.metaBlock}>
            <Row label="Tanggal" value={`${x.tanggal} · ${x.waktu}`} />
            <Row label="Shift" value={x.shift} />
            <Row label="Area" value={x.area} />
            <Row label="Pelaksana" value={x.pelaksana} />
            <Row label="Jabatan" value={x.jabatan} />
            <Row label="Departemen" value={x.departemen} />
            <Row label="Approved By" value={x.approved_by} />
            <Row label="Approved At" value={x.approved_at} />
          </View>

          {cols.length > 0 && x.rows?.length > 0 ? (
            <View style={{ padding: 16, gap: 8 }}>
              <Text style={styles.sectionTitle}>HASIL OBSERVASI ({x.rows.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableWrap}>
                <View>
                  <View style={styles.trHead}>
                    {cols.map((c) => (
                      <Text key={c.key} style={[styles.th, { width: 140 }]} numberOfLines={2}>{c.label}</Text>
                    ))}
                  </View>
                  {x.rows.map((r: any, idx: number) => (
                    <View key={idx} style={[styles.tr, idx % 2 ? styles.trAlt : null]}>
                      {cols.map((c) => (
                        <Text key={c.key} style={[styles.td, { width: 140 }]} numberOfLines={3}>{String(r[c.key] ?? "")}</Text>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          ) : (
            <Text style={styles.empty}>Tidak ada detail item observasi.</Text>
          )}
        </ScrollView>
      )}

      {x?.pdf ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable testID="open-pdf-button" onPress={() => WebBrowser.openBrowserAsync(x.pdf)} style={styles.pdfBtn}>
            <FilePdf size={20} color={colors.onSurfaceInverse} weight="fill" />
            <Text style={styles.pdfText}>BUKA PDF</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 1.5, borderColor: c.border, backgroundColor: c.surface },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: c.border },
  headerTitle: { color: c.onSurface, fontFamily: fonts.displayBold, fontWeight: "900", fontSize: 18 },
  jenis: { color: c.onSurface, fontFamily: fonts.displayBold, fontWeight: "800", fontSize: 20, lineHeight: 26 },
  code: { color: c.muted, fontFamily: fonts.mono, fontSize: 12 },
  metaBlock: { paddingHorizontal: 16, backgroundColor: c.surfaceSecondary, borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: c.border },
  row: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderColor: c.divider, gap: 12 },
  rowLabel: { color: c.muted, fontFamily: fonts.monoBold, fontSize: 11, width: 110, textTransform: "uppercase" },
  rowValue: { color: c.onSurface, fontFamily: fonts.body, fontSize: 14, flex: 1 },
  sectionTitle: { color: c.onSurface, fontFamily: fonts.monoBold, fontSize: 13, letterSpacing: 0.8 },
  tableWrap: { borderWidth: 1.5, borderColor: c.border },
  trHead: { flexDirection: "row", backgroundColor: c.surfaceInverse },
  th: { color: c.onSurfaceInverse, fontFamily: fonts.monoBold, fontSize: 11, padding: 8, textTransform: "uppercase" },
  tr: { flexDirection: "row", backgroundColor: c.surface },
  trAlt: { backgroundColor: c.surfaceSecondary },
  td: { color: c.onSurface, fontFamily: fonts.body, fontSize: 12, padding: 8, borderTopWidth: 1, borderColor: c.divider },
  empty: { color: c.muted, fontFamily: fonts.body, padding: 16 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1.5, borderColor: c.border, backgroundColor: c.surface },
  pdfBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: c.surfaceInverse, borderWidth: 1.5, borderColor: c.border, paddingVertical: 16 },
  pdfText: { color: c.onSurfaceInverse, fontFamily: fonts.displayBold, fontWeight: "800", fontSize: 14, letterSpacing: 0.5 },
}));
