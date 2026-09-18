import React from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import Svg, { Circle, G } from "react-native-svg";
import { Warning, ClipboardText, LockOpen, CheckCircle } from "phosphor-react-native";
import { api } from "@/src/api";
import { makeStyles, useTheme, fonts, ThemeColors } from "@/src/theme";
import { Loading, riskColor } from "@/src/ui";

function Donut({ open, close, colors }: { open: number; close: number; colors: ThemeColors }) {
  const total = Math.max(1, open + close);
  const r = 52;
  const cx = 70;
  const cy = 70;
  const circ = 2 * Math.PI * r;
  const closeFrac = close / total;
  return (
    <Svg width={140} height={140}>
      <G rotation={-90} origin="70, 70">
        <Circle cx={cx} cy={cy} r={r} stroke={colors.error} strokeWidth={18} fill="none" />
        <Circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={colors.success}
          strokeWidth={18}
          fill="none"
          strokeDasharray={`${circ * closeFrac} ${circ}`}
        />
      </G>
    </Svg>
  );
}

function BarList({ items, colorFor }: { items: { label: string; value: number }[]; colorFor?: (label: string) => string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <View style={{ gap: 10 }}>
      {items.map((it) => (
        <View key={it.label} style={{ gap: 4 }}>
          <View style={styles.barLabelRow}>
            <Text style={styles.barLabel} numberOfLines={1}>{it.label}</Text>
            <Text style={styles.barValue}>{it.value}</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${(it.value / max) * 100}%`, backgroundColor: colorFor ? colorFor(it.label) : colors.brandPrimary }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function Dashboard() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const hz = useQuery({ queryKey: ["hazardStats"], queryFn: api.hazardStats });
  const ins = useQuery({ queryKey: ["inspectionStats"], queryFn: api.inspectionStats });

  const loading = hz.isLoading || ins.isLoading;
  const s = hz.data;
  const i = ins.data;

  const kpis = [
    { label: "Total Hazard", value: s?.total ?? 0, icon: Warning, color: colors.brandPrimary },
    { label: "Open", value: s?.open ?? 0, icon: LockOpen, color: colors.error },
    { label: "Close", value: s?.close ?? 0, icon: CheckCircle, color: colors.success },
    { label: "Total Inspeksi", value: i?.total ?? 0, icon: ClipboardText, color: colors.info },
  ];

  const riskItems = s ? Object.entries(s.by_risk).map(([label, value]) => ({ label, value: value as number })) : [];

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>DASHBOARD</Text>
        <Text style={styles.subtitle}>Monitoring & Statistik K3</Text>
      </View>

      {loading ? (
        <Loading label="Menghitung statistik..." />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
          refreshControl={<RefreshControl refreshing={hz.isRefetching} onRefresh={() => { hz.refetch(); ins.refetch(); }} tintColor={colors.brandPrimary} />}
        >
          <View style={styles.kpiGrid}>
            {kpis.map((k) => (
              <View key={k.label} testID={`kpi-${k.label}`} style={styles.kpiTile}>
                <View style={[styles.kpiBar, { backgroundColor: k.color }]} />
                <View style={{ padding: 12, gap: 6 }}>
                  <k.icon size={20} color={k.color} weight="fill" />
                  <Text style={styles.kpiValue}>{k.value.toLocaleString("id-ID")}</Text>
                  <Text style={styles.kpiLabel}>{k.label}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>STATUS LAPORAN</Text>
            <View style={styles.donutRow}>
              <Donut open={s?.open ?? 0} close={s?.close ?? 0} colors={colors} />
              <View style={{ gap: 12 }}>
                <View style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: colors.success }]} />
                  <Text style={styles.legendText}>Close · {s?.close ?? 0}</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: colors.error }]} />
                  <Text style={styles.legendText}>Open · {s?.open ?? 0}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>TINGKAT RESIKO</Text>
            <BarList items={riskItems} colorFor={(l) => riskColor(colors, l)} />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>HAZARD PER DEPARTEMEN</Text>
            <BarList items={s?.by_dept ?? []} />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>KATEGORI BAHAYA</Text>
            <BarList items={(s?.by_cat ?? []).slice(0, 6)} colorFor={() => colors.surfaceInverse} />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>TREN BULANAN</Text>
            <BarList items={s?.by_month ?? []} />
          </View>

          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>INSPEKSI PER JENIS</Text>
            <BarList items={i?.by_type ?? []} colorFor={() => colors.info} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1.5, borderColor: c.border, backgroundColor: c.surface },
  title: { color: c.onSurface, fontFamily: fonts.displayBold, fontWeight: "900", fontSize: 26, letterSpacing: -0.5 },
  subtitle: { color: c.muted, fontFamily: fonts.mono, fontSize: 12, marginTop: 2 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  kpiTile: { width: "47.5%", flexGrow: 1, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface },
  kpiBar: { height: 6, width: "100%" },
  kpiValue: { color: c.onSurface, fontFamily: fonts.monoBold, fontSize: 26 },
  kpiLabel: { color: c.muted, fontFamily: fonts.mono, fontSize: 11, textTransform: "uppercase" },
  chartCard: { borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface, padding: 16, gap: 14 },
  chartTitle: { color: c.onSurface, fontFamily: fonts.monoBold, fontSize: 13, letterSpacing: 0.8 },
  donutRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 14, height: 14, borderWidth: 1, borderColor: c.border },
  legendText: { color: c.onSurface, fontFamily: fonts.mono, fontSize: 13 },
  barLabelRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  barLabel: { color: c.onSurface, fontFamily: fonts.body, fontSize: 12, flex: 1 },
  barValue: { color: c.onSurface, fontFamily: fonts.monoBold, fontSize: 12 },
  barTrack: { height: 14, backgroundColor: c.surfaceTertiary, borderWidth: 1, borderColor: c.border },
  barFill: { height: "100%" },
}));
