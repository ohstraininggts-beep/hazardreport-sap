"""Google Sheets access layer.

Reads use the public CSV export (no credentials needed, works immediately).
Writes/appends use a Google Service Account (GOOGLE_SERVICE_ACCOUNT_JSON in .env).
"""
import os
import csv
import io
import json
import time
import threading
import requests

SPREADSHEET_ID = os.environ.get("SPREADSHEET_ID", "")

# Worksheet gids in the source spreadsheet
HAZARD_GID = 1004364146
INSPECTION_GID = 1410632592
EMPLOYEE_GID = 1707709803

_cache = {}
_cache_lock = threading.Lock()
CACHE_TTL = 45  # seconds

_gc = None
_gc_tried = False


def _service_account_info():
    raw = (os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON") or "").strip()
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        # allow base64 or file path
        if os.path.isfile(raw):
            with open(raw) as f:
                return json.load(f)
        return None


def get_gspread_client():
    """Return an authorized gspread client, or None if no credentials."""
    global _gc, _gc_tried
    if _gc is not None:
        return _gc
    if _gc_tried:
        return None
    _gc_tried = True
    info = _service_account_info()
    if not info:
        return None
    try:
        import gspread
        from google.oauth2.service_account import Credentials
        scopes = ["https://www.googleapis.com/auth/spreadsheets"]
        creds = Credentials.from_service_account_info(info, scopes=scopes)
        _gc = gspread.authorize(creds)
        return _gc
    except Exception as e:
        print("gspread auth failed:", e)
        return None


def writes_enabled():
    return get_gspread_client() is not None


def _fetch_csv(gid: int):
    url = f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/export?format=csv&gid={gid}"
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    text = r.content.decode("utf-8", errors="ignore")
    rows = list(csv.reader(io.StringIO(text)))
    return rows


def get_rows(gid: int, force: bool = False):
    """Return list of rows (list[list[str]]) with caching."""
    now = time.time()
    with _cache_lock:
        entry = _cache.get(gid)
        if entry and not force and (now - entry[0] < CACHE_TTL):
            return entry[1]
    rows = _fetch_csv(gid)
    with _cache_lock:
        _cache[gid] = (now, rows)
    return rows


def invalidate(gid: int):
    with _cache_lock:
        _cache.pop(gid, None)


def append_row(gid: int, values: list):
    """Append a row to the worksheet identified by gid. Requires service account."""
    gc = get_gspread_client()
    if gc is None:
        raise RuntimeError("NO_CREDENTIALS")
    sh = gc.open_by_key(SPREADSHEET_ID)
    ws = sh.get_worksheet_by_id(gid)
    ws.append_row(values, value_input_option="USER_ENTERED")
    invalidate(gid)


def update_cell(gid: int, row: int, col: int, value: str):
    gc = get_gspread_client()
    if gc is None:
        raise RuntimeError("NO_CREDENTIALS")
    sh = gc.open_by_key(SPREADSHEET_ID)
    ws = sh.get_worksheet_by_id(gid)
    ws.update_cell(row, col, value)
    invalidate(gid)


def normalize_image_url(*candidates):
    """Pick the best directly-viewable image URL from candidates."""
    for c in candidates:
        if not c:
            continue
        c = c.strip()
        if not c:
            continue
        if "uploads.zite.com" in c:
            return c
        if "uc?export=view" in c:
            return c
        # drive Open?id=X  or  file/d/X/view  -> uc?export=view&id=X
        if "drive.google.com" in c:
            fid = None
            if "id=" in c:
                fid = c.split("id=")[-1].split("&")[0]
            elif "/file/d/" in c:
                fid = c.split("/file/d/")[-1].split("/")[0]
            if fid:
                return f"https://drive.google.com/uc?export=view&id={fid}"
        if c.startswith("http"):
            return c
    return ""
