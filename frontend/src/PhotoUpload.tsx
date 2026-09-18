import React, { useState } from "react";
import { View, Text, Pressable, Modal, ActivityIndicator, Linking } from "react-native";
import { Image } from "expo-image";
import { Camera, Images, Trash, Plus } from "phosphor-react-native";
import { makeStyles, useTheme, fonts } from "@/src/theme";
import { pickImage, uploadImage, ensureCamera, ensureLibrary } from "@/src/photo";

export function PhotoUpload({
  label,
  required,
  value,
  onChange,
  testID,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (url: string) => void;
  testID?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handle = async (source: "camera" | "library") => {
    setOpen(false);
    setError("");
    const perm = source === "camera" ? await ensureCamera() : await ensureLibrary();
    if (!perm.ok) {
      if (!perm.canAskAgain) {
        setError("Izin ditolak. Buka Pengaturan untuk mengaktifkan.");
      } else {
        setError("Izin diperlukan untuk melanjutkan.");
      }
      return;
    }
    try {
      const pick = await pickImage(source);
      if (!pick) return;
      setBusy(true);
      const res = await uploadImage(pick);
      onChange(res.url);
    } catch (e: any) {
      setError(e?.message || "Upload gagal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>
        {label} {required ? <Text style={{ color: colors.error }}>*</Text> : null}
      </Text>
      {value ? (
        <View>
          <Image source={value} style={styles.preview} contentFit="cover" transition={150} />
          <Pressable testID={`${testID}-remove`} onPress={() => onChange("")} style={styles.removeBtn}>
            <Trash size={16} color={colors.onError} weight="fill" />
          </Pressable>
        </View>
      ) : (
        <Pressable testID={testID} onPress={() => setOpen(true)} style={styles.dropzone} disabled={busy}>
          {busy ? (
            <ActivityIndicator color={colors.brandPrimary} />
          ) : (
            <>
              <Plus size={28} color={colors.onSurface} weight="bold" />
              <Text style={styles.dropText}>TAMBAH FOTO</Text>
            </>
          )}
        </Pressable>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {error.includes("Pengaturan") ? (
        <Pressable onPress={() => Linking.openSettings()} testID={`${testID}-settings`}>
          <Text style={styles.settingsLink}>Buka Pengaturan</Text>
        </Pressable>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>PILIH SUMBER FOTO</Text>
            <Pressable testID={`${testID}-camera`} onPress={() => handle("camera")} style={styles.opt}>
              <Camera size={22} color={colors.onSurface} weight="fill" />
              <Text style={styles.optText}>Kamera</Text>
            </Pressable>
            <Pressable testID={`${testID}-gallery`} onPress={() => handle("library")} style={styles.opt}>
              <Images size={22} color={colors.onSurface} weight="fill" />
              <Text style={styles.optText}>Galeri</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  label: { color: c.onSurface, fontFamily: fonts.monoBold, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 },
  dropzone: { height: 130, borderWidth: 2, borderColor: c.border, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: c.surfaceSecondary },
  dropText: { color: c.onSurface, fontFamily: fonts.monoBold, fontSize: 12, letterSpacing: 0.5 },
  preview: { width: "100%", height: 200, borderWidth: 1.5, borderColor: c.border },
  removeBtn: { position: "absolute", top: 8, right: 8, backgroundColor: c.error, borderWidth: 1.5, borderColor: c.border, padding: 8 },
  error: { color: c.error, fontFamily: fonts.body, fontSize: 12 },
  settingsLink: { color: c.brandPrimary, fontFamily: fonts.monoBold, fontSize: 13, textDecorationLine: "underline" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: c.surface, borderTopWidth: 2, borderColor: c.borderStrong, padding: 16, gap: 10 },
  sheetTitle: { color: c.onSurface, fontFamily: fonts.displayBold, fontWeight: "800", fontSize: 15, marginBottom: 4 },
  opt: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1.5, borderColor: c.border, padding: 16, backgroundColor: c.surfaceSecondary },
  optText: { color: c.onSurface, fontFamily: fonts.body, fontSize: 16, fontWeight: "600" },
}));
