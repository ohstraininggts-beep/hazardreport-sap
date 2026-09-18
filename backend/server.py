import os
import uuid
import logging
import io
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional

import jwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Header, Query, Request
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from pydantic import BaseModel
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import sheets
import storage_client

JWT_SECRET = os.environ.get("JWT_SECRET", "dev-secret")
JWT_ALGO = "HS256"

app = FastAPI()
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gts")

# ----- WIB timezone helpers -----
WIB = timezone(timedelta(hours=8))  # WITA (Sulawesi mining site)


def now_wib():
    return datetime.now(WIB)


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
class LoginBody(BaseModel):
    username: str
    password: str


def make_token(user: dict) -> str:
    payload = {**user, "exp": datetime.now(timezone.utc) + timedelta(days=30)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])


async def current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Not authenticated")
    try:
        data = decode_token(authorization.split(" ", 1)[1])
        return data
    except Exception:
        raise HTTPException(401, "Invalid token")


def _find_employee(username: str, password: str):
    rows = sheets.get_rows(sheets.EMPLOYEE_GID)
    uname = username.strip().lower()
    pwd = password.strip()
    for r in rows[1:]:
        if len(r) < 5:
            continue
        nik = (r[1] or "").strip()
        nama = (r[2] or "").strip()
        if nama.lower() == uname and nik and nik.lower() == pwd.lower():
            return {
                "nik": nik,
                "nama": nama,
                "jabatan": (r[3] or "").strip(),
                "departemen": (r[4] or "").strip(),
                "pt": (r[6].strip() if len(r) > 6 else ""),
            }
    return None


@api.post("/auth/login")
async def login(body: LoginBody):
    emp = await run_in_threadpool(_find_employee, body.username, body.password)
    if not emp:
        raise HTTPException(401, "Nama Karyawan atau NIK tidak ditemukan")
    token = make_token(emp)
    return {"token": token, "user": emp}


@api.get("/auth/me")
async def me(user: dict = Depends(current_user)):
    return {k: user[k] for k in ("nik", "nama", "jabatan", "departemen", "pt") if k in user}


# ----- Monitoring auth (Superintendent / Manager / Head Dept) -----
MON_PASSWORD = os.environ.get("MON_PASSWORD", "123gtspastibisa")


class MonLoginBody(BaseModel):
    username: str
    password: str


def _find_employee_by_name(name: str):
    rows = sheets.get_rows(sheets.EMPLOYEE_GID)
    uname = name.strip().lower()
    for r in rows[1:]:
        if len(r) < 5:
            continue
        nama = (r[2] or "").strip()
        if nama.lower() == uname:
            return {
                "nik": (r[1] or "").strip(),
                "nama": nama,
                "jabatan": (r[3] or "").strip(),
                "departemen": (r[4] or "").strip(),
            }
    return None


@api.post("/monitoring/login")
async def monitoring_login(body: MonLoginBody):
    if body.password.strip() != MON_PASSWORD:
        raise HTTPException(401, "Password salah")
    uname = body.username.strip().lower()
    if uname == "admin":
        mon_user = {"nama": "Master", "role": "master", "departemen": "", "scope": "Semua Departemen", "jabatan": "Administrator"}
    else:
        emp = await run_in_threadpool(_find_employee_by_name, body.username)
        if not emp:
            raise HTTPException(401, "Username tidak ditemukan di Data Karyawan")
        mon_user = {"nama": emp["nama"], "role": "head", "departemen": emp["departemen"], "scope": emp["departemen"] or "-", "jabatan": emp["jabatan"]}
    token = make_token({**mon_user, "mon": True})
    return {"token": token, "user": mon_user}


@api.get("/monitoring/inspections")
async def monitoring_inspections(user: dict = Depends(current_user)):
    if not user.get("mon"):
        raise HTTPException(403, "Bukan sesi monitoring")
    items = await run_in_threadpool(_load_inspections)
    dept = (user.get("departemen") or "").strip()
    if user.get("role") != "master" and dept:
        items = [x for x in items if x.get("departemen") == dept]
    light = [{k: x[k] for k in x if k not in ("columns", "rows", "form")} for x in items]
    for y, x in zip(light, items):
        y["row_count"] = x.get("item_count", 0)
    total = len(light)
    approved = sum(1 for x in light if x["status"].lower() == "approved")
    return {"total": total, "approved": approved, "pending": total - approved, "scope": user.get("scope", ""), "items": light}


# ---------------------------------------------------------------------------
# Hazard Report
# ---------------------------------------------------------------------------
HAZARD_CATEGORIES = [
    ("biologis", "Bahaya Biologis", 13),
    ("fisik", "Bahaya Fisik", 14),
    ("ergonomi", "Bahaya Ergonomi", 15),
    ("kimia", "Bahaya Kimia", 16),
    ("psikologis", "Bahaya Psikologis", 17),
    ("mekanikal", "Bahaya Mekanikal", 18),
    ("kelistrikan", "Bahaya Kelistrikan", 19),
    ("tambang", "Bahaya Khas Tambang", 20),
    ("kebakaran", "Bahaya Kebakaran", 21),
]
CAT_BY_KEY = {c[0]: c for c in HAZARD_CATEGORIES}


import html as _html


def _cell(r, i):
    v = (r[i].strip() if len(r) > i and r[i] else "")
    return _html.unescape(v) if v else v


def _hazard_to_obj(r, idx):
    # detect hazard category value
    kategori = ""
    kategori_key = ""
    for key, label, col in HAZARD_CATEGORIES:
        v = _cell(r, col)
        if v:
            kategori = label
            kategori_key = key
            break
    tindakan_tidak_aman = _cell(r, 22)
    foto_sebelum = sheets.normalize_image_url(_cell(r, 31), _cell(r, 28))
    foto_sesudah = sheets.normalize_image_url(_cell(r, 32), _cell(r, 29))
    return {
        "id": idx,  # sheet row number (1-based incl header)
        "timestamp": _cell(r, 0),
        "tanggal": _cell(r, 1),
        "waktu": _cell(r, 2),
        "email": _cell(r, 3),
        "shift": _cell(r, 4),
        "nik": _cell(r, 5),
        "observer": _cell(r, 6),
        "jabatan": _cell(r, 7),
        "departemen": _cell(r, 8),
        "deskripsi": _cell(r, 9),
        "lokasi": _cell(r, 10),
        "lokasi_detail": _cell(r, 11),
        "jenis_bahaya": _cell(r, 12),
        "kategori_bahaya": kategori,
        "kategori_key": kategori_key,
        "detail_bahaya": next((_cell(r, c) for _, _, c in HAZARD_CATEGORIES if _cell(r, c)), ""),
        "tindakan_tidak_aman": tindakan_tidak_aman,
        "resiko": _cell(r, 23),
        "tingkat_resiko": _cell(r, 24),
        "tindakan_perbaikan": _cell(r, 25),
        "pic": _cell(r, 26),
        "status": _cell(r, 27) or "Open",
        "foto_sebelum": foto_sebelum,
        "foto_sesudah": foto_sesudah,
        "pdf": _cell(r, 30),
        "tanggal_valid": _cell(r, 33),
    }


def _load_hazards():
    rows = sheets.get_rows(sheets.HAZARD_GID)
    out = []
    for i, r in enumerate(rows[1:], start=2):
        if not any(x.strip() for x in r[:12] if x):
            continue
        if not _cell(r, 9):  # skip rows without deskripsi
            continue
        out.append(_hazard_to_obj(r, i))
    out.reverse()  # newest first
    return out


@api.get("/hazards")
async def list_hazards(
    status: Optional[str] = None,
    departemen: Optional[str] = None,
    tingkat: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 40,
    offset: int = 0,
):
    items = await run_in_threadpool(_load_hazards)
    if status:
        items = [x for x in items if x["status"].lower() == status.lower()]
    if departemen:
        items = [x for x in items if x["departemen"] == departemen]
    if tingkat:
        items = [x for x in items if x["tingkat_resiko"].lower() == tingkat.lower()]
    if search:
        s = search.lower()
        items = [x for x in items if s in x["deskripsi"].lower() or s in x["lokasi"].lower() or s in x["observer"].lower()]
    total = len(items)
    page = items[offset: offset + limit]
    return {"total": total, "items": page}


@api.get("/hazards/stats")
async def hazard_stats():
    items = await run_in_threadpool(_load_hazards)
    total = len(items)
    open_c = sum(1 for x in items if x["status"].lower() == "open")
    close_c = sum(1 for x in items if x["status"].lower() == "close")
    by_risk = {}
    by_dept = {}
    by_cat = {}
    by_month = {}
    for x in items:
        by_risk[x["tingkat_resiko"] or "-"] = by_risk.get(x["tingkat_resiko"] or "-", 0) + 1
        if x["departemen"]:
            by_dept[x["departemen"]] = by_dept.get(x["departemen"], 0) + 1
        if x["kategori_bahaya"]:
            by_cat[x["kategori_bahaya"]] = by_cat.get(x["kategori_bahaya"], 0) + 1
        # month from tanggal dd/mm/yyyy
        t = x["tanggal"]
        mkey = ""
        for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
            try:
                d = datetime.strptime(t.split(" ")[0].strip(), fmt)
                mkey = d.strftime("%Y-%m")
                break
            except Exception:
                continue
        if mkey:
            by_month[mkey] = by_month.get(mkey, 0) + 1
    top_dept = sorted(by_dept.items(), key=lambda kv: kv[1], reverse=True)[:6]
    months = sorted(by_month.items())[-6:]
    return {
        "total": total,
        "open": open_c,
        "close": close_c,
        "by_risk": by_risk,
        "by_dept": [{"label": k, "value": v} for k, v in top_dept],
        "by_cat": [{"label": k, "value": v} for k, v in sorted(by_cat.items(), key=lambda kv: kv[1], reverse=True)],
        "by_month": [{"label": k, "value": v} for k, v in months],
    }


@api.get("/hazards/{row_id}")
async def get_hazard(row_id: int):
    items = await run_in_threadpool(_load_hazards)
    for x in items:
        if x["id"] == row_id:
            return x
    raise HTTPException(404, "Not found")


class HazardCreate(BaseModel):
    shift: str = "Shift Siang"
    deskripsi: str
    lokasi: str
    lokasi_detail: str = ""
    jenis_bahaya: str = "Kondisi Tidak Aman (Unsafe Condition)"
    kategori_key: str = ""
    detail_bahaya: str = ""
    tindakan_tidak_aman: str = ""
    resiko: str = ""
    tingkat_resiko: str = "Rendah"
    tindakan_perbaikan: str = ""
    pic: str = ""
    status: str = "Open"
    foto_sebelum: str = ""
    foto_sesudah: str = ""


@api.post("/hazards")
async def create_hazard(body: HazardCreate, user: dict = Depends(current_user)):
    if not sheets.writes_enabled():
        raise HTTPException(503, "Google Sheets belum terhubung. Admin perlu menambahkan Service Account.")
    now = now_wib()
    row = [""] * 35
    row[0] = now.strftime("%d/%m/%Y %H:%M:%S")
    row[1] = now.strftime("%d/%m/%Y")
    row[2] = now.strftime("%H:%M")
    row[3] = ""  # email (unknown from login)
    row[4] = body.shift
    row[5] = user.get("nik", "")
    row[6] = user.get("nama", "")
    row[7] = user.get("jabatan", "")
    row[8] = user.get("departemen", "")
    row[9] = body.deskripsi
    row[10] = body.lokasi
    row[11] = body.lokasi_detail
    row[12] = body.jenis_bahaya
    if "Tindakan" in body.jenis_bahaya or "Unsafe Action" in body.jenis_bahaya:
        row[22] = body.detail_bahaya or body.tindakan_tidak_aman
    elif body.kategori_key in CAT_BY_KEY:
        row[CAT_BY_KEY[body.kategori_key][2]] = body.detail_bahaya
    row[23] = body.resiko
    row[24] = body.tingkat_resiko
    row[25] = body.tindakan_perbaikan
    row[26] = body.pic
    row[27] = body.status
    row[28] = body.foto_sebelum
    row[29] = body.foto_sesudah
    row[31] = body.foto_sebelum
    row[32] = body.foto_sesudah
    row[33] = now.strftime("%d/%m/%Y")
    try:
        await run_in_threadpool(sheets.append_row, sheets.HAZARD_GID, row)
    except RuntimeError:
        raise HTTPException(503, "Google Sheets belum terhubung.")
    except Exception as e:
        logger.exception("append hazard failed")
        raise HTTPException(500, f"Gagal menyimpan: {e}")
    return {"ok": True}


# ---------------------------------------------------------------------------
# Inspections
# ---------------------------------------------------------------------------
import json as _json


def _form_item_count(form):
    """Number of observation points regardless of form type."""
    if not isinstance(form, dict):
        return 0
    ft = form.get("formType", "")
    if ft == "checklist":
        return sum(len(c.get("questions", []) or []) for c in form.get("categories", []) or [])
    if ft in ("scoring", "preplab"):
        return len(form.get("items", []) or [])
    # table / legacy
    return len(form.get("rows", []) or [])


def _inspection_to_obj(r, idx):
    form_raw = _cell(r, 14)
    form = None
    if form_raw:
        try:
            form = _json.loads(form_raw)
        except Exception:
            form = None
    form = form if isinstance(form, dict) else {}
    header = form.get("headerData", {}) if isinstance(form.get("headerData"), dict) else {}
    area = header.get("area", "") or form.get("lokasi", "") or form.get("lokasiArea", "") or form.get("site", "")
    return {
        "id": idx,
        "timestamp": _cell(r, 0),
        "tanggal": _cell(r, 1),
        "waktu": _cell(r, 2),
        "email": _cell(r, 3),
        "shift": _cell(r, 4),
        "nik": _cell(r, 5),
        "pelaksana": _cell(r, 6),
        "jabatan": _cell(r, 7),
        "departemen": _cell(r, 8),
        "jenis": _cell(r, 9),
        "status": _cell(r, 10) or "Pending",
        "approved_by": _cell(r, 11),
        "approved_at": _cell(r, 12),
        "pdf": _cell(r, 13),
        "form_title": form.get("formTitle", ""),
        "form_code": form.get("formCode", ""),
        "form_type": form.get("formType", ""),
        "area": area,
        "item_count": _form_item_count(form),
        # keep legacy keys for table-type detail
        "columns": form.get("columns", []) or [],
        "rows": form.get("rows", []) or [],
        # full structured form for detail rendering (stripped in list endpoint)
        "form": form,
    }


def _load_inspections():
    rows = sheets.get_rows(sheets.INSPECTION_GID)
    out = []
    for i, r in enumerate(rows[1:], start=2):
        if not _cell(r, 6) and not _cell(r, 9):
            continue
        out.append(_inspection_to_obj(r, i))
    out.reverse()
    return out


@api.get("/inspections")
async def list_inspections(
    jenis: Optional[str] = None,
    status: Optional[str] = None,
    departemen: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 40,
    offset: int = 0,
):
    items = await run_in_threadpool(_load_inspections)
    # trim heavy rows/columns for list
    light = []
    for x in items:
        y = {k: x[k] for k in x if k not in ("columns", "rows", "form")}
        y["row_count"] = x.get("item_count", 0)
        light.append(y)
    if jenis:
        light = [x for x in light if x["jenis"] == jenis]
    if status:
        light = [x for x in light if x["status"].lower() == status.lower()]
    if departemen:
        light = [x for x in light if x["departemen"] == departemen]
    if search:
        s = search.lower()
        light = [x for x in light if s in x["jenis"].lower() or s in x["pelaksana"].lower() or s in x["area"].lower()]
    total = len(light)
    return {"total": total, "items": light[offset: offset + limit]}


@api.get("/inspections/stats")
async def inspection_stats():
    items = await run_in_threadpool(_load_inspections)
    total = len(items)
    approved = sum(1 for x in items if x["status"].lower() == "approved")
    pending = total - approved
    by_type = {}
    for x in items:
        j = x["jenis"] or "-"
        by_type[j] = by_type.get(j, 0) + 1
    top = sorted(by_type.items(), key=lambda kv: kv[1], reverse=True)[:6]
    return {
        "total": total,
        "approved": approved,
        "pending": pending,
        "by_type": [{"label": k, "value": v} for k, v in top],
    }


@api.get("/inspections/{row_id}")
async def get_inspection(row_id: int):
    items = await run_in_threadpool(_load_inspections)
    for x in items:
        if x["id"] == row_id:
            return x
    raise HTTPException(404, "Not found")


class InspRow(BaseModel):
    values: dict


class InspectionCreate(BaseModel):
    jenis: str
    shift: str = "Shift Siang"
    status: str = "Pending"
    email: str = ""
    form: dict = {}
    # legacy table fields (fallback)
    area: str = ""
    tanggal: str = ""
    waktu: str = ""
    columns: list = []
    rows: list = []
    kesimpulan: str = ""


@api.post("/inspections")
async def create_inspection(body: InspectionCreate, user: dict = Depends(current_user)):
    if not sheets.writes_enabled():
        raise HTTPException(503, "Google Sheets belum terhubung. Admin perlu menambahkan Service Account.")
    now = now_wib()
    if body.form:
        # Full Zite-structured form (checklist/scoring/preplab/table). Inject
        # server-side identity + timestamps so the stored JSON is complete.
        form = dict(body.form)
        form.setdefault("formType", form.get("formType", ""))
        form["jenisInspeksi"] = body.jenis
        form["nik"] = user.get("nik", "")
        form["nama"] = user.get("nama", "")
        form["jabatan"] = user.get("jabatan", "")
        form["departemen"] = user.get("departemen", "")
        form["email"] = body.email
        form["shift"] = body.shift
        form.setdefault("tanggal", body.tanggal or now.strftime("%Y-%m-%d"))
        form.setdefault("waktu", body.waktu)
    else:
        form = {
            "formTitle": body.jenis,
            "headerData": {"area": body.area, "hariTanggal": body.tanggal or now.strftime("%Y-%m-%d"), "waktuInspeksi": body.waktu},
            "columns": body.columns,
            "rows": body.rows,
            "kesimpulan": body.kesimpulan,
            "observer1Name": user.get("nama", ""),
            "observer1Nik": user.get("nik", ""),
            "observer1Jabatan": user.get("jabatan", ""),
            "observer1Departemen": user.get("departemen", ""),
            "formType": "table",
        }
    row = [""] * 15
    row[0] = now.strftime("%d/%m/%Y, %H.%M.%S")
    row[1] = now.strftime("%d/%m/%Y")
    row[2] = now.strftime("%H.%M.%S")
    row[3] = body.email
    row[4] = body.shift
    row[5] = user.get("nik", "")
    row[6] = user.get("nama", "")
    row[7] = user.get("jabatan", "")
    row[8] = user.get("departemen", "")
    row[9] = body.jenis
    row[10] = body.status
    row[14] = _json.dumps(form, ensure_ascii=False)
    try:
        await run_in_threadpool(sheets.append_row, sheets.INSPECTION_GID, row)
    except RuntimeError:
        raise HTTPException(503, "Google Sheets belum terhubung.")
    except Exception as e:
        logger.exception("append inspection failed")
        raise HTTPException(500, f"Gagal menyimpan: {e}")
    return {"ok": True}


class ApproveBody(BaseModel):
    status: str = "Approved"


@api.post("/inspections/{row_id}/approve")
async def approve_inspection(row_id: int, body: ApproveBody, user: dict = Depends(current_user)):
    if not sheets.writes_enabled():
        raise HTTPException(503, "Google Sheets belum terhubung.")
    now = now_wib()
    approver = user.get("nama", "") or "Approver"
    try:
        # 1-based columns: status=11, approved_by=12, approved_at=13
        await run_in_threadpool(sheets.update_cell, sheets.INSPECTION_GID, row_id, 11, body.status)
        await run_in_threadpool(sheets.update_cell, sheets.INSPECTION_GID, row_id, 12, approver)
        await run_in_threadpool(sheets.update_cell, sheets.INSPECTION_GID, row_id, 13, now.strftime("%d/%m/%Y %H:%M"))
    except Exception as e:
        logger.exception("approve failed")
        raise HTTPException(500, f"Gagal approve: {e}")
    return {"ok": True, "status": body.status, "approved_by": approver}


# ---------------------------------------------------------------------------
# Meta options for form dropdowns
# ---------------------------------------------------------------------------
@api.get("/meta/options")
async def meta_options():
    hz = await run_in_threadpool(_load_hazards)
    lokasi = sorted({x["lokasi"] for x in hz if x["lokasi"]})
    pic = sorted({x["pic"] for x in hz if x["pic"]})
    dept = sorted({x["departemen"] for x in hz if x["departemen"]})
    ins = await run_in_threadpool(_load_inspections)
    jenis_inspeksi = sorted({x["jenis"] for x in ins if x["jenis"]})
    ins_dept = sorted({x["departemen"] for x in ins if x["departemen"]})
    return {
        "lokasi": lokasi,
        "pic": pic,
        "departemen": sorted(set(dept) | set(ins_dept)),
        "jenis_inspeksi": jenis_inspeksi,
        "kategori_bahaya": [{"key": k, "label": l} for k, l, _ in HAZARD_CATEGORIES],
        "tingkat_resiko": ["Rendah", "Sedang", "Tinggi", "Ekstrem"],
        "shift": ["Shift Siang", "Shift Malam"],
    }


# ---------------------------------------------------------------------------
# Upload / serve images
# ---------------------------------------------------------------------------
@api.post("/upload")
async def upload(request: Request, file: UploadFile = File(...), user: dict = Depends(current_user)):
    data = await file.read()
    ext = (file.filename or "img.jpg").split(".")[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp", "heic"):
        ext = "jpg"
    path = f"{storage_client.APP_NAME}/uploads/{user.get('nik','anon')}/{uuid.uuid4().hex}.{ext}"
    ct = file.content_type or "image/jpeg"
    try:
        await run_in_threadpool(storage_client.put_object, path, data, ct)
    except Exception as e:
        logger.exception("upload failed")
        raise HTTPException(500, f"Upload gagal: {e}")
    token = make_token(user)
    base = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").strip()
    if not base:
        # derive from incoming request (handles preview/prod hosts automatically)
        base = str(request.base_url).rstrip("/")
    url = f"{base}/api/files/{path}?token={token}"
    return {"path": path, "url": url}


@api.get("/files/{path:path}")
async def serve_file(path: str, token: Optional[str] = Query(None), authorization: Optional[str] = Header(None)):
    ok = False
    if authorization and authorization.startswith("Bearer "):
        try:
            decode_token(authorization.split(" ", 1)[1]); ok = True
        except Exception:
            ok = False
    if not ok and token:
        try:
            decode_token(token); ok = True
        except Exception:
            ok = False
    if not ok:
        raise HTTPException(401, "Unauthorized")
    try:
        content, ct = await run_in_threadpool(storage_client.get_object, path)
    except Exception:
        raise HTTPException(404, "File not found")
    return StreamingResponse(io.BytesIO(content), media_type=ct)


# ---------------------------------------------------------------------------
# PDF generation
# ---------------------------------------------------------------------------
def _hazard_pdf(x: dict) -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.pdfgen import canvas
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    w, h = A4
    y = h - 20 * mm
    c.setFillColorRGB(0.949, 0.361, 0.020)
    c.rect(0, h - 18 * mm, w, 18 * mm, fill=1, stroke=0)
    c.setFillColorRGB(1, 1, 1)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(15 * mm, h - 12 * mm, "HAZARD REPORT - PT. GANE TAMBANG SENTOSA")
    y = h - 28 * mm
    c.setFillColorRGB(0, 0, 0)

    def line(label, val):
        nonlocal y
        c.setFont("Helvetica-Bold", 9)
        c.drawString(15 * mm, y, f"{label}:")
        c.setFont("Helvetica", 9)
        text = c.beginText(55 * mm, y)
        for chunk in _wrap(str(val), 80):
            text.textLine(chunk)
        c.drawText(text)
        y -= max(6 * mm, 4 * mm * max(1, len(_wrap(str(val), 80))))

    line("Tanggal", x.get("tanggal"))
    line("Observer", x.get("observer"))
    line("Jabatan", x.get("jabatan"))
    line("Departemen", x.get("departemen"))
    line("Lokasi", f"{x.get('lokasi')} {x.get('lokasi_detail')}")
    line("Jenis Bahaya", x.get("jenis_bahaya"))
    line("Kategori", f"{x.get('kategori_bahaya')} - {x.get('detail_bahaya')}")
    line("Deskripsi", x.get("deskripsi"))
    line("Resiko", x.get("resiko"))
    line("Tingkat Resiko", x.get("tingkat_resiko"))
    line("Tindakan Perbaikan", x.get("tindakan_perbaikan"))
    line("PIC", x.get("pic"))
    line("Status", x.get("status"))
    c.showPage()
    c.save()
    buf.seek(0)
    return buf.read()


def _wrap(s, n):
    s = s or ""
    words = s.split()
    lines, cur = [], ""
    for wd in words:
        if len(cur) + len(wd) + 1 <= n:
            cur = (cur + " " + wd).strip()
        else:
            lines.append(cur); cur = wd
    if cur:
        lines.append(cur)
    return lines or [""]


@api.get("/hazards/{row_id}/pdf")
async def hazard_pdf(row_id: int, token: Optional[str] = Query(None)):
    items = await run_in_threadpool(_load_hazards)
    x = next((i for i in items if i["id"] == row_id), None)
    if not x:
        raise HTTPException(404, "Not found")
    pdf = await run_in_threadpool(_hazard_pdf, x)
    return StreamingResponse(io.BytesIO(pdf), media_type="application/pdf",
                             headers={"Content-Disposition": f"inline; filename=hazard-{row_id}.pdf"})


@api.get("/")
async def root():
    return {"app": "GTS Safety Portal API", "writes": sheets.writes_enabled()}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    try:
        await run_in_threadpool(storage_client.init_storage)
        logger.info("storage init ok")
    except Exception as e:
        logger.warning(f"storage init failed: {e}")
