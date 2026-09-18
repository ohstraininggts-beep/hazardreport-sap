import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { storage } from "@/src/utils/storage";
import { api, TOKEN_KEY } from "@/src/api";

export type PickResult = { uri: string; name: string; type: string } | null;

export async function ensureCamera(): Promise<{ ok: boolean; canAskAgain: boolean }> {
  const cur = await ImagePicker.getCameraPermissionsAsync();
  if (cur.granted) return { ok: true, canAskAgain: true };
  const req = await ImagePicker.requestCameraPermissionsAsync();
  return { ok: req.granted, canAskAgain: req.canAskAgain };
}

export async function ensureLibrary(): Promise<{ ok: boolean; canAskAgain: boolean }> {
  const cur = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (cur.granted) return { ok: true, canAskAgain: true };
  const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return { ok: req.granted, canAskAgain: req.canAskAgain };
}

export async function pickImage(source: "camera" | "library"): Promise<PickResult> {
  const opts: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    quality: 0.6,
    allowsEditing: false,
  };
  const res =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(opts)
      : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  const name = a.fileName || `photo_${Date.now()}.jpg`;
  const type = a.mimeType || "image/jpeg";
  return { uri: a.uri, name, type };
}

export async function uploadImage(pick: { uri: string; name: string; type: string }): Promise<{ path: string; url: string }> {
  const token = await storage.secureGet<string>(TOKEN_KEY, "");
  const form = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(pick.uri)).blob();
    form.append("file", blob, pick.name);
  } else {
    form.append("file", { uri: pick.uri, name: pick.name, type: pick.type } as any);
  }
  const res = await fetch(api.uploadUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Upload gagal (${res.status}) ${t}`);
  }
  return res.json();
}
