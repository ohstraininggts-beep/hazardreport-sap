import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Plus, Trash } from "phosphor-react-native";
import { api } from "@/src/api";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { Field, SelectField, PrimaryButton } from "@/src/ui";

const COLUMNS = [
  { key: "item", label: "Item Pemeriksaan" },
  { key: "hasil", label: "Hasil" },
  { key: "keterangan", label: "Keterangan" },
];

type ObsRow = { item: string; hasil: string; keterangan: string };

export default function InspectionCreate() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: opts } = useQuery({ queryKey: ["options"], queryFn: api.options });

  const [jenis, setJenis] = useState("");
  const [area, setArea] = useState("");
  const [waktu, setWaktu] = useState("");
  const [kesimpulan, setKesimpulan] = useState("");
  const [rows, setRows] = useState<ObsRow[]>([{ item: "", hasil: "", keterangan: "" }]);
  const [err, setErr] = useState("");

  const setRow = (i: number, k: keyof ObsRow, v: string) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));
  const addRow = () => setRows((r) => [...r, { item: "", hasil: "", keterangan: "" }]);
  const removeRow = (i: number) => setRows((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r));

  const mut = useMutation({
    mutationFn: () =>
      api.createInspection({
        jenis,
        area,
        waktu,
        columns: COLUMNS,
        rows: rows.filter((r) => r.item.trim()),
        kesimpulan,
        status: "Pending",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections"] });
      qc.invalidateQueries({ queryKey: ["inspectionStats"] });
    },
    onError: (e: any) => setErr(e?.message || "Gagal menyimpan."),
  });

  const submit = () => {
    setErr("");
    if (!jenis.trim()) return setErr("Jenis inspeksi wajib dipilih.");
    if (!rows.some((r) => r.item.trim())) return setErr("Minimal satu item observasi.");
    mut.mutate();
  };

  if (mut.isSuccess) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center", padding: 24 }]}>
        <CheckCircle size={72} color={colors.success} weight="fill" />
        <Text style={styles.successTitle}>INSPEKSI TERKIRIM</Text>
        <Text style={styles.successSub}>Data inspeksi berhasil disimpan ke Google Sheet.</Text>
        <PrimaryButton testID="success-back" label="Kembali" onPress={() => router.back()} style={{ marginTop: 24, alignSelf: "stretch" }} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="back-button" onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>BUAT INSPEKSI</Text>
      </View>

      <KeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }} bottomOffset={20}>
        <SelectField label="Jenis Inspeksi *" value={jenis} onSelect={setJenis} options={opts?.jenis_inspeksi || []} placeholder="Pilih jenis inspeksi" testID="jenis-select" />
        <Field label="Area / Lokasi" value={area} onChangeText={setArea} placeholder="Area inspeksi" testID="area-input" />
        <Field label="Waktu" value={waktu} onChangeText={setWaktu} placeholder="Contoh: 08:00" testID="waktu-input" />

        <Text style={styles.sectionTitle}>ITEM OBSERVASI</Text>
        {rows.map((r, i) => (
          <View key={i} style={styles.rowCard}>
            <View style={styles.rowCardHead}>
              <Text style={styles.rowCardTitle}>Item #{i + 1}</Text>
              <Pressable testID={`remove-row-${i}`} onPress={() => removeRow(i)} hitSlop={8}>
                <Trash size={18} color={colors.error} weight="fill" />
              </Pressable>
            </View>
            <Field label="Item Pemeriksaan" value={r.item} onChangeText={(v: string) => setRow(i, "item", v)} placeholder="Item / unit / objek" testID={`item-input-${i}`} />
            <Field label="Hasil" value={r.hasil} onChangeText={(v: string) => setRow(i, "hasil", v)} placeholder="Sesuai / Tidak Sesuai / STOP" testID={`hasil-input-${i}`} />
            <Field label="Keterangan" value={r.keterangan} onChangeText={(v: string) => setRow(i, "keterangan", v)} placeholder="Catatan" testID={`ket-input-${i}`} />
          </View>
        ))}
        <Pressable testID="add-row-button" onPress={addRow} style={styles.addBtn}>
          <Plus size={18} color={colors.onSurface} weight="bold" />
          <Text style={styles.addText}>TAMBAH ITEM</Text>
        </Pressable>

        <Field label="Kesimpulan" value={kesimpulan} onChangeText={setKesimpulan} placeholder="Kesimpulan inspeksi" multiline testID="kesimpulan-input" />

        {err ? <Text style={styles.err} testID="create-error">{err}</Text> : null}
        <PrimaryButton testID="submit-inspection" label="Kirim Inspeksi" onPress={submit} loading={mut.isPending} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 1.5, borderColor: c.border, backgroundColor: c.surface },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: c.border },
  headerTitle: { color: c.onSurface, fontFamily: fonts.displayBold, fontWeight: "900", fontSize: 17 },
  sectionTitle: { color: c.onSurface, fontFamily: fonts.monoBold, fontSize: 13, letterSpacing: 0.8, marginTop: 4 },
  rowCard: { borderWidth: 1.5, borderColor: c.border, padding: 12, gap: 12, backgroundColor: c.surfaceSecondary },
  rowCardHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowCardTitle: { color: c.onSurface, fontFamily: fonts.monoBold, fontSize: 12 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 2, borderStyle: "dashed", borderColor: c.border, paddingVertical: 14 },
  addText: { color: c.onSurface, fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 0.5 },
  err: { color: c.error, fontFamily: fonts.body, fontSize: 13, backgroundColor: c.brandTertiary, padding: 12, borderWidth: 1.5, borderColor: c.error },
  successTitle: { color: c.onSurface, fontFamily: fonts.displayBold, fontWeight: "900", fontSize: 22, marginTop: 16 },
  successSub: { color: c.muted, fontFamily: fonts.body, fontSize: 14, textAlign: "center", marginTop: 6 },
}));
