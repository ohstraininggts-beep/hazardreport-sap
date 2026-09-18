import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { ArrowLeft, FilePdf } from "phosphor-react-native";
import { api } from "@/src/api";
import { makeStyles, useTheme, fonts, radii } from "@/src/theme";
import { Badge, Loading, statusColor } from "@/src/ui";

function ansColor(colors: any, a: string) {
  const v = (a || "").toUpperCase();
  if (v === "YA" || v === "YES") return colors.success;
  if (v === "TDK" || v === "TIDAK" || v === "NO") return colors.error;
  if (v === "N/A" || v === "NA") return colors.info;
  return colors.muted;
}

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
  const form: any = x?.form || {};
  const ft = form.formType || x?.form_type || "";

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="back-button" onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>DETAIL INSPEKSI</Text>
      </View>

      {isLoading || !x ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + (x.pdf ? 100 : 24) }}>
          <View style={{ padding: 14, gap: 8 }}>
            <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
              <Badge label={x.status} color={statusColor(colors, x.status)} />
              {form.formCode ? <Text style={styles.code}>{form.formCode}</Text> : null}
            </View>
            <Text style={styles.jenis}>{x.jenis || x.form_title}</Text>
          </View>

          <View style={styles.metaBlock}>
            <Row label="Tanggal" value={`${x.tanggal}${x.waktu ? " · " + x.waktu : ""}`} />
            <Row label="Shift" value={x.shift} />
            <Row label="Lokasi" value={x.area || form.lokasi} />
            <Row label="Pelaksana" value={x.pelaksana} />
            <Row label="Jabatan" value={x.jabatan} />
            <Row label="Departemen" value={x.departemen} />
            <Row label="Approved By" value={x.approved_by} />
            <Row label="Approved At" value={x.approved_at} />
          </View>

          {/* CHECKLIST */}
          {ft === "checklist" && (form.categories || []).map((cat: any, ci: number) => (
            <View key={ci} style={styles.section}>
              <Text style={styles.sectionTitle}>{cat.title}</Text>
              {(cat.questions || []).map((q: any, qi: number) => (
                <View key={qi} style={styles.qRow}>
                  <Text style={styles.qText}>{qi + 1}. {q.text}</Text>
                  <View style={[styles.ansPill, { backgroundColor: ansColor(colors, q.answer) }]}>
                    <Text style={styles.ansText}>{q.answer || "-"}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}

          {/* SCORING */}
          {ft === "scoring" && (
            <View style={styles.section}>
              <View style={styles.scoreBanner}>
                <Text style={styles.scoreBannerText}>Total Skor: {form.total ?? "-"} / {form.totalMax ?? "-"}</Text>
                {form.totalMax ? <Text style={styles.scorePct}>{Math.round(((form.total || 0) / form.totalMax) * 100)}%</Text> : null}
              </View>
              {(form.items || []).map((it: any, i: number) => (
                <View key={i} style={styles.qRow}>
                  <Text style={styles.qText}>{i + 1}. {it.text}</Text>
                  <View style={[styles.ansPill, { backgroundColor: colors.brandPrimary }]}>
                    <Text style={styles.ansText}>{it.poinAktual ?? "-"}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* PREPLAB */}
          {ft === "preplab" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Item Pemeriksaan ({(form.items || []).length})</Text>
              {(form.items || []).map((it: any, i: number) => (
                <View key={i} style={styles.qCol}>
                  <View style={styles.qRow}>
                    <Text style={styles.qText}>{i + 1}. {it.text}</Text>
                    <View style={[styles.ansPill, { backgroundColor: ansColor(colors, it.answer) }]}>
                      <Text style={styles.ansText}>{it.answer || "-"}</Text>
                    </View>
                  </View>
                  {it.keterangan ? <Text style={styles.ket}>Ket: {it.keterangan}</Text> : null}
                </View>
              ))}
            </View>
          )}

          {/* TABLE */}
          {ft === "table" && (form.columns || []).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Observasi ({(form.rows || []).length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tableWrap}>
                <View>
                  <View style={styles.trHead}>
                    {form.columns.map((col: any) => (
                      <Text key={col.key} style={[styles.th, { width: 130 }]} numberOfLines={2}>{col.label}</Text>
                    ))}
                  </View>
                  {(form.rows || []).map((r: any, idx: number) => (
                    <View key={idx} style={[styles.tr, idx % 2 ? styles.trAlt : null]}>
                      {form.columns.map((col: any) => (
                        <Text key={col.key} style={[styles.td, { width: 130 }]} numberOfLines={3}>{String(r[col.key] ?? "")}</Text>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* CATATAN */}
          {(form.temuan || form.catatan || form.kesimpulan) ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Catatan / Temuan</Text>
              <Text style={styles.note}>{form.temuan || form.catatan || form.kesimpulan}</Text>
            </View>
          ) : null}
        </ScrollView>
      )}

      {x?.pdf ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable testID="open-pdf-button" onPress={() => WebBrowser.openBrowserAsync(x.pdf)} style={styles.pdfBtn}>
            <FilePdf size={18} color={colors.onSurfaceInverse} weight="fill" />
            <Text style={styles.pdfText}>BUKA PDF</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderColor: c.divider, backgroundColor: c.surface },
  backBtn: { width: 36, height: 36, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  headerTitle: { color: c.onSurface, fontFamily: fonts.displayBold, fontSize: 15 },
  jenis: { color: c.onSurface, fontFamily: fonts.displayBold, fontSize: 17, lineHeight: 22 },
  code: { color: c.muted, fontFamily: fonts.medium, fontSize: 10.5 },
  metaBlock: { paddingHorizontal: 14, backgroundColor: c.surfaceSecondary, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.divider },
  row: { flexDirection: "row", paddingVertical: 7, borderBottomWidth: 1, borderColor: c.divider, gap: 10 },
  rowLabel: { color: c.muted, fontFamily: fonts.semibold, fontSize: 10, width: 95, textTransform: "uppercase" },
  rowValue: { color: c.onSurface, fontFamily: fonts.medium, fontSize: 12.5, flex: 1 },
  section: { padding: 14, gap: 8 },
  sectionTitle: { color: c.brandPrimary, fontFamily: fonts.displayBold, fontSize: 12.5, textTransform: "uppercase", letterSpacing: 0.3 },
  qRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderColor: c.divider },
  qCol: { paddingVertical: 4, borderBottomWidth: 1, borderColor: c.divider },
  qText: { color: c.onSurface, fontFamily: fonts.body, fontSize: 12, lineHeight: 16, flex: 1 },
  ansPill: { minWidth: 40, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill, alignItems: "center" },
  ansText: { color: "#FFFFFF", fontFamily: fonts.semibold, fontSize: 10.5 },
  ket: { color: c.muted, fontFamily: fonts.body, fontSize: 11, fontStyle: "italic", paddingBottom: 4 },
  scoreBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: c.brandTertiary, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 9 },
  scoreBannerText: { color: c.onBrandTertiary, fontFamily: fonts.displayBold, fontSize: 12.5 },
  scorePct: { color: c.brandPrimary, fontFamily: fonts.displayBold, fontSize: 15 },
  tableWrap: { borderWidth: 1, borderColor: c.border, borderRadius: radii.sm },
  trHead: { flexDirection: "row", backgroundColor: c.surfaceInverse },
  th: { color: c.onSurfaceInverse, fontFamily: fonts.semibold, fontSize: 10, padding: 7 },
  tr: { flexDirection: "row", backgroundColor: c.surface },
  trAlt: { backgroundColor: c.surfaceSecondary },
  td: { color: c.onSurface, fontFamily: fonts.body, fontSize: 11, padding: 7, borderTopWidth: 1, borderColor: c.divider },
  note: { color: c.onSurface, fontFamily: fonts.body, fontSize: 12.5, lineHeight: 18, backgroundColor: c.surfaceSecondary, padding: 12, borderRadius: radii.sm, borderWidth: 1, borderColor: c.border },
  footer: { paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1, borderColor: c.divider, backgroundColor: c.surface },
  pdfBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: c.surfaceInverse, borderRadius: radii.md, paddingVertical: 14 },
  pdfText: { color: c.onSurfaceInverse, fontFamily: fonts.displayBold, fontSize: 13, letterSpacing: 0.4 },
}));
