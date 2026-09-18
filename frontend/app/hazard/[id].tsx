import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import { ArrowLeft, FilePdf } from "phosphor-react-native";
import { api } from "@/src/api";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { Badge, Loading, riskColor, statusColor } from "@/src/ui";

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

export default function HazardDetail() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: x, isLoading } = useQuery({ queryKey: ["hazard", id], queryFn: () => api.hazard(Number(id)) });

  const openPdf = () => WebBrowser.openBrowserAsync(`${api.base}/api/hazards/${id}/pdf`);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="back-button" onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>DETAIL HAZARD</Text>
      </View>

      {isLoading || !x ? (
        <Loading />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
          <View style={styles.badgeRow}>
            <Badge label={x.tingkat_resiko || "-"} color={riskColor(colors, x.tingkat_resiko)} />
            <Badge label={x.status} color={statusColor(colors, x.status)} />
          </View>
          <Text style={styles.desc}>{x.deskripsi}</Text>

          <View style={styles.photoGrid}>
            <View style={styles.photoCol}>
              <Text style={styles.photoCap}>SEBELUM</Text>
              {x.foto_sebelum ? (
                <Image testID="foto-sebelum" source={x.foto_sebelum} style={styles.photo} contentFit="cover" transition={150} />
              ) : (
                <View style={[styles.photo, styles.photoEmpty]}><Text style={styles.photoEmptyText}>Tidak ada</Text></View>
              )}
            </View>
            <View style={styles.photoCol}>
              <Text style={styles.photoCap}>SESUDAH</Text>
              {x.foto_sesudah ? (
                <Image testID="foto-sesudah" source={x.foto_sesudah} style={styles.photo} contentFit="cover" transition={150} />
              ) : (
                <View style={[styles.photo, styles.photoEmpty]}><Text style={styles.photoEmptyText}>Tidak ada</Text></View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Row label="Tanggal" value={`${x.tanggal} · ${x.waktu}`} />
            <Row label="Shift" value={x.shift} />
            <Row label="Observer" value={x.observer} />
            <Row label="Jabatan" value={x.jabatan} />
            <Row label="Departemen" value={x.departemen} />
            <Row label="Lokasi" value={x.lokasi} />
            <Row label="Lokasi Detail" value={x.lokasi_detail} />
            <Row label="Jenis Bahaya" value={x.jenis_bahaya} />
            <Row label="Kategori" value={x.kategori_bahaya} />
            <Row label="Detail Bahaya" value={x.detail_bahaya} />
            <Row label="Tindakan Tidak Aman" value={x.tindakan_tidak_aman} />
            <Row label="Resiko" value={x.resiko} />
            <Row label="Tindakan Perbaikan" value={x.tindakan_perbaikan} />
            <Row label="PIC" value={x.pic} />
          </View>
        </ScrollView>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable testID="generate-pdf-button" onPress={openPdf} style={styles.pdfBtn}>
          <FilePdf size={20} color={colors.onSurfaceInverse} weight="fill" />
          <Text style={styles.pdfText}>GENERATE PDF</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 1.5, borderColor: c.border, backgroundColor: c.surface },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: c.border },
  headerTitle: { color: c.onSurface, fontFamily: fonts.displayBold, fontWeight: "900", fontSize: 18 },
  badgeRow: { flexDirection: "row", gap: 8, padding: 16, paddingBottom: 8 },
  desc: { color: c.onSurface, fontFamily: fonts.display, fontWeight: "700", fontSize: 20, lineHeight: 27, paddingHorizontal: 16, marginBottom: 12 },
  photoGrid: { flexDirection: "row", gap: 12, paddingHorizontal: 16, marginBottom: 8 },
  photoCol: { flex: 1, gap: 6 },
  photoCap: { color: c.muted, fontFamily: fonts.monoBold, fontSize: 11, letterSpacing: 0.5 },
  photo: { width: "100%", aspectRatio: 1, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  photoEmpty: { alignItems: "center", justifyContent: "center" },
  photoEmptyText: { color: c.muted, fontFamily: fonts.body, fontSize: 12 },
  section: { padding: 16, gap: 0 },
  row: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderColor: c.divider, gap: 12 },
  rowLabel: { color: c.muted, fontFamily: fonts.monoBold, fontSize: 11, width: 120, textTransform: "uppercase" },
  rowValue: { color: c.onSurface, fontFamily: fonts.body, fontSize: 14, flex: 1 },
  footer: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1.5, borderColor: c.border, backgroundColor: c.surface },
  pdfBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: c.surfaceInverse, borderWidth: 1.5, borderColor: c.border, paddingVertical: 16 },
  pdfText: { color: c.onSurfaceInverse, fontFamily: fonts.displayBold, fontWeight: "800", fontSize: 14, letterSpacing: 0.5 },
}));
