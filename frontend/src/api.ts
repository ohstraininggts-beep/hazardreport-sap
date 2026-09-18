import { storage } from "@/src/utils/storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL as string;
export const TOKEN_KEY = "gts_token";

async function authHeader() {
  const token = await storage.secureGet<string>(TOKEN_KEY, "");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function req(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(await authHeader()),
    ...(options.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${BASE}/api${path}`, { ...options, headers });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `Error ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : "Terjadi kesalahan");
  }
  return data;
}

export const api = {
  base: BASE,
  login: (username: string, password: string) =>
    req("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  me: () => req("/auth/me"),
  hazards: (qs = "") => req(`/hazards${qs}`),
  hazard: (id: number) => req(`/hazards/${id}`),
  hazardStats: () => req("/hazards/stats"),
  createHazard: (body: any) => req("/hazards", { method: "POST", body: JSON.stringify(body) }),
  inspections: (qs = "") => req(`/inspections${qs}`),
  inspection: (id: number) => req(`/inspections/${id}`),
  inspectionStats: () => req("/inspections/stats"),
  createInspection: (body: any) => req("/inspections", { method: "POST", body: JSON.stringify(body) }),
  options: () => req("/meta/options"),
  uploadUrl: `${BASE}/api/upload`,
};
