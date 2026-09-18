import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, MagnifyingGlass, CaretRight, Sun, Moon, Plus, Trash, ClipboardText } from "phosphor-react-native";
import { api } from "@/src/api";
import { useAuth } from "@/src/auth";
import { makeStyles, useTheme, fonts, radii } from "@/src/theme";
import { SelectField, PrimaryButton } from "@/src/ui";
import { TEMPLATES, TYPE_META, TYPE_ORDER, groupScoring, Template, ScoringItem } from "@/src/inspectionForms";

const CHECK_OPTS_NA = ["YA", "TDK", "N/A"];
const CHECK_OPTS = ["YA", "TDK"];
const PL_OPTS = ["Ya", "Tidak"];

function Seg({ options, value, onChange, colorMap }: { options: string[]; value: string; onChange: (v: string) => void; colorMap?: Record<string, string> }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {options.map((o) => {
        const active = o === value;
        const activeColor = colorMap?.[o] || colors.brandPrimary;
        return (
          <Pressable
            key={o}
            onPress={() => onChange(o)}
            style={{ flex: 1, paddingVertical: 6, alignItems: "center", borderRadius: radii.sm, borderWidth: 1, borderColor: active ? activeColor : colors.border, backgroundColor: active ? activeColor : colors.surface }}
          >
            <Text style={{ color: active ? "#FFFFFF" : colors.muted, fontFamily: fonts.semibold, fontSize: 11 }}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ScoreChips({ max, value, onChange }: { max: number; value: number | null; onChange: (v: number) => void }) {
  const { colors } = useTheme();
  const arr = Array.from({ length: max + 1 }, (_, i) => i);
  return (
    <View style={{ flexDirection: "row", gap: 4, flexWrap: "wrap" }}>
      {arr.map((n) => {
        const active = value === n;
        return (
          <Pressable key={n} onPress={() => onChange(n)} style={{ width: 30, height: 30, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: active ? colors.brandPrimary : colors.border, backgroundColor: active ? colors.brandPrimary : colors.surface }}>
            <Text style={{ color: active ? "#FFFFFF" : colors.muted, fontFamily: fonts.semibold, fontSize: 12 }}>{n}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function InspectionCreate() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: opts } = useQuery({ queryKey: ["options"], queryFn: api.options });

  const [tpl, setTpl] = useState<Template | null>(null);
  const [pickSearch, setPickSearch] = useState("");
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");

  // header
  const [email, setEmail] = useState("");
  const [shiftMalam, setShiftMalam] = useState(false);
  const [tanggal, setTanggal] = useState("");
  const [waktu, setWaktu] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [lokasiDetail, setLokasiDetail] = useState("");
  const [catatan, setCatatan] = useState("");

  // answers
  const [checkAns, setCheckAns] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<number, number>>({});
  const [plA, setPlA] = useState<Record<number, string>>({});
  const [plK, setPlK] = useState<Record<number, string>>({});
  const [rows, setRows] = useState<Record<string, string>[]>([{}]);

  const steps = useMemo(() => {
    if (!tpl) return [] as { key: string; label: string }[];
    const s: { key: string; label: string }[] = [{ key: "info", label: "Info" }];
    if (tpl.formType === "checklist") {
      (tpl.categories || []).forEach((c, i) => s.push({ key: `c${i}`, label: c.title.replace(/^[A-Z]\.\s*/, "") }));
      s.push({ key: "temuan", label: "Temuan" });
    } else if (tpl.formType === "scoring") {
      s.push({ key: "score", label: "Penilaian" });
      s.push({ key: "catatan", label: "Catatan" });
    } else if (tpl.formType === "preplab") {
      s.push({ key: "items", label: "Pemeriksaan" });
      s.push({ key: "catatan", label: "Catatan" });
    } else {
      s.push({ key: "obs", label: "Observasi" });
      s.push({ key: "kesimpulan", label: "Kesimpulan" });
    }
    s.push({ key: "review", label: "Review" });
    return s;
  }, [tpl]);

  const scoreGroups = useMemo(() => (tpl?.formType === "scoring" ? groupScoring((tpl.items as ScoringItem[]) || []) : []), [tpl]);
  const scoreTotal = useMemo(() => Object.values(scores).reduce((a, b) => a + b, 0), [scores]);
  const scoreMaxTotal = useMemo(() => (tpl?.formType === "scoring" ? ((tpl.items?.length || 0) * (tpl.pointMax || 4)) : 0), [tpl]);

  const buildForm = () => {
    if (!tpl) return {};
    const base: any = {
      formCode: tpl.formCode,
      formTitle: tpl.formTitle,
      formSubtitle: tpl.formSubtitle || "",
      tanggalEfektif: tpl.tanggalEfektif || "",
      revisi: tpl.revisi || "",
      formType: tpl.formType,
      lokasi,
      lokasiDetail,
    };
    if (tpl.formType === "checklist") {
      base.hasNA = !!tpl.hasNA;
      base.categories = (tpl.categories || []).map((c, ci) => ({
        title: c.title,
        questions: c.questions.map((q, qi) => ({ text: q.text, answer: checkAns[`${ci}-${qi}`] || "" })),
      }));
      base.temuan = catatan;
    } else if (tpl.formType === "scoring") {
      base.pointMax = tpl.pointMax || 4;
      base.items = ((tpl.items as ScoringItem[]) || []).map((it, i) => ({ catTitle: it.catTitle || "", text: it.text, poinAktual: scores[i] ?? null }));
      base.total = scoreTotal;
      base.totalMax = scoreMaxTotal;
      base.catatan = catatan;
    } else if (tpl.formType === "preplab") {
      base.items = (tpl.items || []).map((it, i) => ({ text: it.text, answer: plA[i] || "", keterangan: plK[i] || "" }));
      base.catatan = catatan;
    } else {
      base.columns = tpl.columns || [];
      base.rows = rows.filter((r) => Object.values(r).some((v) => (v || "").trim()));
      base.kesimpulan = catatan;
    }
    return base;
  };

  const mut = useMutation({
    mutationFn: () =>
      api.createInspection({
        jenis: tpl!.jenis,
        shift: shiftMalam ? "Shift Malam" : "Shift Siang",
        email,
        tanggal,
        waktu,
        status: "Pending",
        form: buildForm(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inspections"] });
      qc.invalidateQueries({ queryKey: ["inspectionStats"] });
    },
    onError: (e: any) => setErr(e?.message || "Gagal menyimpan."),
  });

  // ---------- PICK PHASE ----------
  if (!tpl) {
    const q = pickSearch.toLowerCase();
    return (
      <View style={styles.root}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable testID="back-button" onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ArrowLeft size={20} color={colors.onSurface} weight="bold" />
          </Pressable>
          <Text style={styles.headerTitle}>PILIH FORMULIR INSPEKSI</Text>
        </View>
        <View style={styles.searchWrap}>
          <MagnifyingGlass size={16} color={colors.muted} weight="bold" />
          <TextInput value={pickSearch} onChangeText={setPickSearch} placeholder="Cari formulir..." placeholderTextColor={colors.muted} style={styles.searchInput} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24, gap: 18 }}>
          {TYPE_ORDER.map((ft) => {
            const list = TEMPLATES.filter((t) => t.formType === ft && (!q || t.jenis.toLowerCase().includes(q) || t.formCode.toLowerCase().includes(q)));
            if (!list.length) return null;
            return (
              <View key={ft} style={{ gap: 8 }}>
                <Text style={styles.groupTitle}>{TYPE_META[ft].label} · {list.length}</Text>
                {list.map((t) => (
                  <Pressable
                    key={t.jenis}
                    testID={`tpl-${t.formCode}`}
                    onPress={() => { setTpl(t); setStep(0); }}
                    style={({ pressed }) => [styles.tplCard, pressed && { opacity: 0.9 }]}
                  >
                    <View style={styles.tplIcon}><ClipboardText size={16} color={colors.brandPrimary} weight="fill" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tplName} numberOfLines={2}>{t.jenis}</Text>
                      <Text style={styles.tplCode}>{t.formCode}</Text>
                    </View>
                    <CaretRight size={16} color={colors.muted} weight="bold" />
                  </Pressable>
                ))}
              </View>
            );
          })}
          <View style={{ height: 12 }} />
        </ScrollView>
      </View>
    );
  }

  // ---------- SUCCESS ----------
  if (mut.isSuccess) {
    return (
      <View style={[styles.root, { alignItems: "center", justifyContent: "center", padding: 24 }]}>
        <CheckCircle size={72} color={colors.success} weight="fill" />
        <Text style={styles.successTitle}>INSPEKSI TERKIRIM</Text>
        <Text style={styles.successSub}>{tpl.formTitle} berhasil disimpan ke Google Sheet (status Pending, menunggu approval).</Text>
        <PrimaryButton testID="success-back" label="Kembali" onPress={() => router.back()} style={{ marginTop: 24, alignSelf: "stretch" }} />
      </View>
    );
  }

  const cur = steps[step];
  const isLast = step === steps.length - 1;

  const submit = () => {
    setErr("");
    mut.mutate();
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="back-button" onPress={() => (step === 0 ? setTpl(null) : setStep((s) => s - 1))} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={20} color={colors.onSurface} weight="bold" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.formCode}>{tpl.formCode}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{tpl.formTitle}</Text>
        </View>
      </View>

      {/* Tab strip */}
      <View style={styles.tabStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 12, alignItems: "center" }}>
          {steps.map((s, i) => {
            const active = i === step;
            return (
              <Pressable key={s.key} onPress={() => setStep(i)} style={[styles.tab, active && { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary }]}>
                <Text style={[styles.tabText, active && { color: "#FFFFFF" }]} numberOfLines={1}>{s.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <Text style={styles.stepInfo}>Langkah {step + 1} dari {steps.length}</Text>

      <KeyboardAwareScrollView contentContainerStyle={{ padding: 14, paddingBottom: 40, gap: 12 }} bottomOffset={16}>
        {/* INFO */}
        {cur.key === "info" && (
          <View style={{ gap: 12 }}>
            <Text style={styles.sectionTitle}>Informasi Pelaksana</Text>
            <View style={styles.autoGrid}>
              <Auto label="Nama Pelaksana" value={user?.nama} />
              <Auto label="NIK" value={user?.nik} />
              <Auto label="Jabatan" value={user?.jabatan} />
              <Auto label="Departemen" value={user?.departemen} />
            </View>
            <FieldSm label="Alamat Email" value={email} onChangeText={setEmail} placeholder="email@perusahaan.com" keyboardType="email-address" />
            <View style={{ gap: 6 }}>
              <Text style={styles.fieldLabel}>Shift</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable onPress={() => setShiftMalam(false)} style={[styles.shiftBtn, !shiftMalam && styles.shiftActive]}>
                  <Sun size={16} color={!shiftMalam ? colors.brandPrimary : colors.muted} weight="fill" />
                  <Text style={[styles.shiftText, !shiftMalam && { color: colors.onSurface }]}>Shift Siang</Text>
                </Pressable>
                <Pressable onPress={() => setShiftMalam(true)} style={[styles.shiftBtn, shiftMalam && styles.shiftActive]}>
                  <Moon size={16} color={shiftMalam ? colors.brandPrimary : colors.muted} weight="fill" />
                  <Text style={[styles.shiftText, shiftMalam && { color: colors.onSurface }]}>Shift Malam</Text>
                </Pressable>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><FieldSm label="Tanggal" value={tanggal} onChangeText={setTanggal} placeholder="dd/mm/yyyy" /></View>
              <View style={{ flex: 1 }}><FieldSm label="Waktu" value={waktu} onChangeText={setWaktu} placeholder="08:00" /></View>
            </View>
            <SelectField label="Lokasi" value={lokasi} onSelect={setLokasi} options={opts?.lokasi || []} placeholder="Pilih lokasi" />
            <FieldSm label="Lokasi Detail" value={lokasiDetail} onChangeText={setLokasiDetail} placeholder="Jelaskan secara spesifik" />
          </View>
        )}

        {/* CHECKLIST categories */}
        {cur.key.startsWith("c") && cur.key !== "catatan" && tpl.formType === "checklist" && (() => {
          const ci = parseInt(cur.key.slice(1), 10);
          const cat = tpl.categories![ci];
          const opts2 = tpl.hasNA ? CHECK_OPTS_NA : CHECK_OPTS;
          return (
            <View style={{ gap: 10 }}>
              <Text style={styles.sectionTitle}>{cat.title}</Text>
              {cat.questions.map((qq, qi) => {
                const key = `${ci}-${qi}`;
                return (
                  <View key={key} style={styles.qCard}>
                    <Text style={styles.qText}>{qi + 1}. {qq.text}</Text>
                    <Seg options={opts2} value={checkAns[key] || ""} onChange={(v) => setCheckAns((s) => ({ ...s, [key]: v }))} colorMap={{ YA: colors.success, TDK: colors.error, "N/A": colors.info }} />
                  </View>
                );
              })}
            </View>
          );
        })()}

        {/* SCORING */}
        {cur.key === "score" && tpl.formType === "scoring" && (
          <View style={{ gap: 10 }}>
            <View style={styles.scoreBanner}>
              <Text style={styles.scoreBannerText}>Total Skor: {scoreTotal} / {scoreMaxTotal}</Text>
              <Text style={styles.scoreBannerPct}>{scoreMaxTotal ? Math.round((scoreTotal / scoreMaxTotal) * 100) : 0}%</Text>
            </View>
            {scoreGroups.map((g) => (
              <View key={g.title || "root"} style={{ gap: 8 }}>
                {g.title ? <Text style={styles.sectionTitle}>{g.title}</Text> : null}
                {g.idxs.map((i) => (
                  <View key={i} style={styles.qCard}>
                    <Text style={styles.qText}>{i + 1}. {(tpl.items![i] as ScoringItem).text}</Text>
                    <ScoreChips max={tpl.pointMax || 4} value={scores[i] ?? null} onChange={(v) => setScores((s) => ({ ...s, [i]: v }))} />
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* PREPLAB items */}
        {cur.key === "items" && tpl.formType === "preplab" && (
          <View style={{ gap: 10 }}>
            <Text style={styles.sectionTitle}>Item Pemeriksaan ({tpl.items?.length || 0})</Text>
            {(tpl.items || []).map((it, i) => (
              <View key={i} style={styles.qCard}>
                <Text style={styles.qText}>{i + 1}. {it.text}</Text>
                <Seg options={PL_OPTS} value={plA[i] || ""} onChange={(v) => setPlA((s) => ({ ...s, [i]: v }))} colorMap={{ Ya: colors.success, Tidak: colors.error }} />
                <TextInput value={plK[i] || ""} onChangeText={(v) => setPlK((s) => ({ ...s, [i]: v }))} placeholder="Keterangan (opsional)" placeholderTextColor={colors.muted} style={styles.ketInput} />
              </View>
            ))}
          </View>
        )}

        {/* TABLE observation */}
        {cur.key === "obs" && tpl.formType === "table" && (
          <View style={{ gap: 10 }}>
            <Text style={styles.sectionTitle}>Item Observasi</Text>
            {rows.map((r, i) => (
              <View key={i} style={styles.qCard}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <Text style={styles.rowNum}>Baris #{i + 1}</Text>
                  <Pressable onPress={() => setRows((rr) => (rr.length > 1 ? rr.filter((_, idx) => idx !== i) : rr))} hitSlop={8}>
                    <Trash size={15} color={colors.error} weight="fill" />
                  </Pressable>
                </View>
                {(tpl.columns || []).map((col) => (
                  <View key={col.key} style={{ gap: 3, marginBottom: 6 }}>
                    <Text style={styles.fieldLabel}>{col.label}</Text>
                    <TextInput value={r[col.key] || ""} onChangeText={(v) => setRows((rr) => rr.map((row, idx) => (idx === i ? { ...row, [col.key]: v } : row)))} placeholder={col.label} placeholderTextColor={colors.muted} style={styles.ketInput} />
                  </View>
                ))}
              </View>
            ))}
            <Pressable onPress={() => setRows((rr) => [...rr, {}])} style={styles.addBtn}>
              <Plus size={16} color={colors.onSurface} weight="bold" />
              <Text style={styles.addText}>TAMBAH BARIS</Text>
            </Pressable>
          </View>
        )}

        {/* CATATAN / TEMUAN / KESIMPULAN */}
        {(cur.key === "temuan" || cur.key === "catatan" || cur.key === "kesimpulan") && (
          <View style={{ gap: 8 }}>
            <Text style={styles.sectionTitle}>{cur.key === "temuan" ? "Temuan & Tindak Lanjut" : cur.key === "kesimpulan" ? "Kesimpulan" : "Catatan"}</Text>
            <TextInput value={catatan} onChangeText={setCatatan} placeholder="Tuliskan temuan / catatan / kesimpulan inspeksi..." placeholderTextColor={colors.muted} multiline style={styles.textarea} />
          </View>
        )}

        {/* REVIEW */}
        {cur.key === "review" && (
          <View style={{ gap: 10 }}>
            <Text style={styles.sectionTitle}>Review & Kirim</Text>
            <View style={styles.reviewCard}>
              <ReviewRow label="Formulir" value={tpl.formTitle} />
              <ReviewRow label="Kode" value={tpl.formCode} />
              <ReviewRow label="Pelaksana" value={user?.nama} />
              <ReviewRow label="Shift" value={shiftMalam ? "Shift Malam" : "Shift Siang"} />
              <ReviewRow label="Tanggal" value={tanggal || "-"} />
              <ReviewRow label="Lokasi" value={lokasi || "-"} />
              {tpl.formType === "scoring" ? <ReviewRow label="Skor" value={`${scoreTotal} / ${scoreMaxTotal}`} /> : null}
            </View>
            {err ? <Text style={styles.err} testID="create-error">{err}</Text> : null}
            <PrimaryButton testID="submit-inspection" label="Kirim Inspeksi" onPress={submit} loading={mut.isPending} />
          </View>
        )}
      </KeyboardAwareScrollView>

      {!isLast ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <PrimaryButton label="Lanjut →" onPress={() => setStep((s) => Math.min(s + 1, steps.length - 1))} />
        </View>
      ) : null}
    </View>
  );
}

function Auto({ label, value }: { label: string; value?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.autoCell}>
      <Text style={styles.autoLabel}>{label}</Text>
      <Text style={styles.autoValue} numberOfLines={1}>{value || "-"}</Text>
    </View>
  );
}

function FieldSm({ label, value, onChangeText, placeholder, keyboardType }: any) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={{ gap: 5 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.muted} keyboardType={keyboardType} style={styles.ketInput} />
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.reviewRow}>
      <Text style={styles.reviewLabel}>{label}</Text>
      <Text style={styles.reviewValue} numberOfLines={2}>{value || "-"}</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1, borderColor: c.divider, backgroundColor: c.surface },
  backBtn: { width: 36, height: 36, borderRadius: radii.pill, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary, borderWidth: 1, borderColor: c.border },
  formCode: { color: c.muted, fontFamily: fonts.medium, fontSize: 9.5, letterSpacing: 0.4 },
  headerTitle: { color: c.onSurface, fontFamily: fonts.displayBold, fontSize: 14 },

  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, margin: 14, marginBottom: 0, paddingHorizontal: 12, height: 44, borderRadius: radii.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  searchInput: { flex: 1, color: c.onSurface, fontFamily: fonts.body, fontSize: 13 },
  groupTitle: { color: c.brandPrimary, fontFamily: fonts.displayBold, fontSize: 12, letterSpacing: 0.3, textTransform: "uppercase" },
  tplCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 11, borderRadius: radii.lg, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  tplIcon: { width: 30, height: 30, borderRadius: radii.sm, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  tplName: { color: c.onSurface, fontFamily: fonts.semibold, fontSize: 12.5, lineHeight: 16 },
  tplCode: { color: c.muted, fontFamily: fonts.medium, fontSize: 10, marginTop: 2 },

  tabStrip: { height: 44, justifyContent: "center", borderBottomWidth: 1, borderColor: c.divider, backgroundColor: c.surfaceSecondary },
  tab: { paddingHorizontal: 12, height: 30, borderRadius: radii.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, justifyContent: "center", maxWidth: 130 },
  tabText: { color: c.muted, fontFamily: fonts.semibold, fontSize: 11 },
  stepInfo: { color: c.muted, fontFamily: fonts.medium, fontSize: 10.5, paddingHorizontal: 14, paddingTop: 6 },

  sectionTitle: { color: c.onSurface, fontFamily: fonts.displayBold, fontSize: 13.5 },
  autoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  autoCell: { flexGrow: 1, minWidth: "45%", backgroundColor: c.surfaceSecondary, borderRadius: radii.sm, borderWidth: 1, borderColor: c.border, paddingHorizontal: 10, paddingVertical: 7 },
  autoLabel: { color: c.muted, fontFamily: fonts.semibold, fontSize: 9, textTransform: "uppercase", letterSpacing: 0.4 },
  autoValue: { color: c.onSurface, fontFamily: fonts.semibold, fontSize: 12, marginTop: 1 },
  fieldLabel: { color: c.muted, fontFamily: fonts.semibold, fontSize: 10, textTransform: "uppercase", letterSpacing: 0.4 },
  ketInput: { borderRadius: radii.sm, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, paddingHorizontal: 10, paddingVertical: 8, color: c.onSurface, fontFamily: fonts.body, fontSize: 12.5 },
  textarea: { minHeight: 120, textAlignVertical: "top", borderRadius: radii.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, paddingHorizontal: 12, paddingVertical: 10, color: c.onSurface, fontFamily: fonts.body, fontSize: 13 },
  shiftBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: radii.sm, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary },
  shiftActive: { borderColor: c.brandPrimary, backgroundColor: c.brandTertiary },
  shiftText: { color: c.muted, fontFamily: fonts.semibold, fontSize: 11.5 },

  qCard: { padding: 10, borderRadius: radii.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, gap: 8 },
  qText: { color: c.onSurface, fontFamily: fonts.medium, fontSize: 12, lineHeight: 17 },
  rowNum: { color: c.muted, fontFamily: fonts.semibold, fontSize: 10.5 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderStyle: "dashed", borderColor: c.border, paddingVertical: 12, borderRadius: radii.md },
  addText: { color: c.onSurface, fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.4 },

  scoreBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: c.brandTertiary, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 10 },
  scoreBannerText: { color: c.onBrandTertiary, fontFamily: fonts.displayBold, fontSize: 13 },
  scoreBannerPct: { color: c.brandPrimary, fontFamily: fonts.displayBold, fontSize: 16 },

  reviewCard: { borderRadius: radii.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, paddingHorizontal: 12 },
  reviewRow: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderColor: c.divider, gap: 10 },
  reviewLabel: { color: c.muted, fontFamily: fonts.semibold, fontSize: 10.5, textTransform: "uppercase", width: 90 },
  reviewValue: { color: c.onSurface, fontFamily: fonts.medium, fontSize: 12.5, flex: 1 },

  err: { color: c.error, fontFamily: fonts.medium, fontSize: 12.5, backgroundColor: c.brandTertiary, padding: 10, borderRadius: radii.sm },
  footer: { paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1, borderColor: c.divider, backgroundColor: c.surface },
  successTitle: { color: c.onSurface, fontFamily: fonts.displayBold, fontSize: 20, marginTop: 16 },
  successSub: { color: c.muted, fontFamily: fonts.body, fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 19 },
}));
