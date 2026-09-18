import React, { useState, useMemo } from "react";
import { View, Text, Pressable } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle } from "phosphor-react-native";
import { api } from "@/src/api";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { Field, SelectField, Segmented, PrimaryButton } from "@/src/ui";
import { PhotoUpload } from "@/src/PhotoUpload";

export default function HazardCreate() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { data: opts } = useQuery({ queryKey: ["options"], queryFn: api.options });

  const [shift, setShift] = useState("Shift Siang");
  const [deskripsi, setDeskripsi] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [lokasiDetail, setLokasiDetail] = useState("");
  const [jenis, setJenis] = useState("Kondisi Tidak Aman");
  const [kategoriLabel, setKategoriLabel] = useState("");
  const [detailBahaya, setDetailBahaya] = useState("");
  const [resiko, setResiko] = useState("");
  const [tingkat, setTingkat] = useState("Rendah");
  const [tindakan, setTindakan] = useState("");
  const [pic, setPic] = useState("");
  const [status, setStatus] = useState("Open");
  const [fotoSebelum, setFotoSebelum] = useState("");
  const [fotoSesudah, setFotoSesudah] = useState("");
  const [err, setErr] = useState("");

  const kategoriKey = useMemo(() => {
    const found = (opts?.kategori_bahaya || []).find((k: any) => k.label === kategoriLabel);
    return found?.key || "";
  }, [kategoriLabel, opts]);

  const mut = useMutation({
    mutationFn: () =>
      api.createHazard({
        shift,
        deskripsi,
        lokasi,
        lokasi_detail: lokasiDetail,
        jenis_bahaya: jenis === "Kondisi Tidak Aman" ? "Kondisi Tidak Aman (Unsafe Condition)" : "Tindakan Tidak Aman (Unsafe Action)",
        kategori_key: kategoriKey,
        detail_bahaya: detailBahaya,
        resiko,
        tingkat_resiko: tingkat,
        tindakan_perbaikan: tindakan,
        pic,
        status,
        foto_sebelum: fotoSebelum,
        foto_sesudah: fotoSesudah,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hazards"] });
      qc.invalidateQueries({ queryKey: ["hazardStats"] });
    },
    onError: (e: any) => setErr(e?.message || "Gagal menyimpan."),
  });

  const submit = () => {
    setErr("");
    if (!deskripsi.trim()) return setErr("Deskripsi temuan wajib diisi.");
    if (!lokasi.trim()) return setErr("Lokasi temuan wajib dipilih.");
    if (!fotoSebelum) return setErr("Foto temuan (Sebelum) wajib diunggah.");
    mut.mutate();
  };

  if (mut.isSuccess) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center", padding: 24 }]}>
        <CheckCircle size={72} color={colors.success} weight="fill" />
        <Text style={styles.successTitle}>LAPORAN TERKIRIM</Text>
        <Text style={styles.successSub}>Hazard report berhasil disimpan ke Google Sheet.</Text>
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
        <Text style={styles.headerTitle}>BUAT HAZARD REPORT</Text>
      </View>

      <KeyboardAwareScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 16 }} bottomOffset={20}>
        <View style={{ gap: 6 }}>
          <Text style={styles.label}>SHIFT</Text>
          <Segmented testID="shift" options={["Shift Siang", "Shift Malam"]} value={shift} onChange={setShift} />
        </View>

        <Field label="Deskripsi Temuan *" value={deskripsi} onChangeText={setDeskripsi} placeholder="Jelaskan temuan..." multiline testID="deskripsi-input" />

        <SelectField label="Lokasi Temuan *" value={lokasi} onSelect={setLokasi} options={opts?.lokasi || []} placeholder="Pilih lokasi" testID="lokasi-select" />
        <Field label="Lokasi Detail" value={lokasiDetail} onChangeText={setLokasiDetail} placeholder="Detail lokasi (opsional)" testID="lokasi-detail-input" />

        <View style={{ gap: 6 }}>
          <Text style={styles.label}>JENIS BAHAYA</Text>
          <Segmented testID="jenis" options={["Kondisi Tidak Aman", "Tindakan Tidak Aman"]} value={jenis} onChange={setJenis} />
        </View>

        {jenis === "Kondisi Tidak Aman" ? (
          <SelectField label="Kategori Bahaya" value={kategoriLabel} onSelect={setKategoriLabel} options={(opts?.kategori_bahaya || []).map((k: any) => k.label)} placeholder="Pilih kategori" testID="kategori-select" />
        ) : null}
        <Field label={jenis === "Kondisi Tidak Aman" ? "Detail Bahaya" : "Tindakan Tidak Aman"} value={detailBahaya} onChangeText={setDetailBahaya} placeholder="Contoh: Jalan Tidak Standar / Pelanggaran Prosedur" testID="detail-bahaya-input" />

        <Field label="Resiko" value={resiko} onChangeText={setResiko} placeholder="Potensi resiko dari temuan" multiline testID="resiko-input" />

        <View style={{ gap: 6 }}>
          <Text style={styles.label}>TINGKAT RESIKO</Text>
          <Segmented testID="tingkat" options={["Rendah", "Sedang", "Tinggi", "Ekstrem"]} value={tingkat} onChange={setTingkat} />
        </View>

        <Field label="Tindakan Perbaikan" value={tindakan} onChangeText={setTindakan} placeholder="Rekomendasi perbaikan" multiline testID="tindakan-input" />

        <SelectField label="PIC" value={pic} onSelect={setPic} options={opts?.pic || []} placeholder="Pilih PIC" testID="pic-select" />

        <View style={{ gap: 6 }}>
          <Text style={styles.label}>STATUS</Text>
          <Segmented testID="status" options={["Open", "Close"]} value={status} onChange={setStatus} />
        </View>

        <PhotoUpload testID="foto-sebelum-upload" label="Foto Temuan (Sebelum)" required value={fotoSebelum} onChange={setFotoSebelum} />
        <PhotoUpload testID="foto-sesudah-upload" label="Foto Temuan (Sesudah)" value={fotoSesudah} onChange={setFotoSesudah} />

        {err ? <Text style={styles.err} testID="create-error">{err}</Text> : null}

        <PrimaryButton testID="submit-hazard" label="Kirim Laporan" onPress={submit} loading={mut.isPending} />
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 1.5, borderColor: c.border, backgroundColor: c.surface },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: c.border },
  headerTitle: { color: c.onSurface, fontFamily: fonts.displayBold, fontWeight: "900", fontSize: 17 },
  label: { color: c.onSurface, fontFamily: fonts.monoBold, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  err: { color: c.error, fontFamily: fonts.body, fontSize: 13, backgroundColor: c.brandTertiary, padding: 12, borderWidth: 1.5, borderColor: c.error },
  successTitle: { color: c.onSurface, fontFamily: fonts.displayBold, fontWeight: "900", fontSize: 22, marginTop: 16 },
  successSub: { color: c.muted, fontFamily: fonts.body, fontSize: 14, textAlign: "center", marginTop: 6 },
}));
