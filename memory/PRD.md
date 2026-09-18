# PRD — GTS Safety Portal (Aplikasi K3 PT. Gane Tambang Sentosa)

## Original Problem Statement
Bangun aplikasi mobile yang menyerupai sistem & tampilan dua web app (inspection-gts.zite.so & sap-hazardreport.zite.so), terintegrasi baca & tulis ke Google Sheet. Inspeksi mengambil record dari sheet "Inspection Log", Hazard Report dari sheet "Hazard Report", sheet lain sebagai data pendukung.

## Architecture
- **Frontend**: Expo Router (React Native + Web), @tanstack/react-query, phosphor-react-native, react-native-svg (charts), expo-image-picker, react-native-keyboard-controller. Tema "Brutalist Industrial" (oranye #F25C05), font Archivo + IBM Plex Sans/Mono. Light + Dark.
- **Backend**: FastAPI. Data source = Google Spreadsheet (ID 1dlMoeHHVXLG1VyhGB3qJW9TMSSzmImpZtnnUqS3BsqM).
  - Reads via public CSV export (cache 45s). Writes/append via Google Service Account (gspread) → `/app/backend/service_account.json`.
  - Photos via Emergent Object Storage (EMERGENT_LLM_KEY). PDF via reportlab.
- **Sheets used**: Hazard Report (gid 1004364146), Inspection Log (gid 1410632592), Data Karyawan (gid 1707709803, untuk login).

## Auth
Login = Nama Karyawan (username) + NIK (password), divalidasi ke sheet Data Karyawan. JWT 30 hari disimpan via secure storage.

## Core Requirements (static)
1. Modul Hazard Report: list + filter (status/resiko) + search + detail + buat baru (+foto Sebelum wajib/Sesudah) → tulis ke sheet.
2. Modul Inspeksi: list + filter + search + detail (tabel observasi) + buat baru → tulis ke sheet.
3. Dashboard: KPI + grafik (status donut, resiko, per departemen, kategori, tren bulanan, per jenis inspeksi).
4. Generate PDF Hazard; buka PDF Inspeksi.
5. Bahasa Indonesia, tampil di HP & PC (web).

## Implemented (2026-06-18)
- ✅ Login Nama/NIK terhadap sheet Data Karyawan (1172 karyawan).
- ✅ Hazard: list (4107), filter status/tingkat resiko, search, detail + foto Sebelum/Sesudah, create (write ke sheet — TERVERIFIKASI round-trip), PDF.
- ✅ Inspeksi: list (3883), filter status, search, detail tabel, create (write ke sheet — TERVERIFIKASI).
- ✅ Dashboard KPI + 6 grafik dari data nyata.
- ✅ Upload foto ke Emergent Object Storage (URL absolut + token).
- ✅ Google Service Account terpasang → fitur tulis AKTIF.
- ✅ Navigasi 4 tab (Beranda, Hazard, Inspeksi, Dashboard) + NativeTabs untuk iOS 26+.

## Backlog / Next
- P1: Template form inspeksi mengikuti 18+ formulir asli (kolom spesifik per jenis).
- P1: Workflow Approve inspeksi & Close hazard (tulis balik status/approved_by ke sheet).
- P2: Tanda tangan digital (sheet signature tersedia).
- P2: Simpan draft offline.
- P2: Ekspor rekap PDF/Excel dashboard.

## Notes
- Ada 2 baris uji berlabel "TEST APP" di sheet (1 Hazard, 1 Inspeksi) — bisa dihapus manual.
- Web/PC: aplikasi berjalan di browser via link preview; setelah Publish tersedia link produksi.
