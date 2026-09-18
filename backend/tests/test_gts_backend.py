"""GTS Safety Portal backend tests."""
import pytest
import requests


# --- Auth ---
class TestAuth:
    def test_login_success(self, api_client, base_url):
        r = api_client.post(f"{base_url}/api/auth/login", json={"username": "Habel Lolopayung", "password": "M0303250220"}, timeout=60)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "token" in j and "user" in j
        assert j["user"].get("nama") == "Habel Lolopayung"
        assert j["user"].get("nik") == "M0303250220"

    def test_login_invalid(self, api_client, base_url):
        r = api_client.post(f"{base_url}/api/auth/login", json={"username": "nope", "password": "nope"}, timeout=60)
        assert r.status_code == 401

    def test_me(self, api_client, base_url, auth_headers):
        r = api_client.get(f"{base_url}/api/auth/me", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        j = r.json()
        assert j.get("nama") == "Habel Lolopayung"

    def test_me_unauth(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/auth/me", timeout=30)
        assert r.status_code == 401


# --- Hazards ---
class TestHazards:
    def test_list(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/hazards?limit=5", timeout=60)
        assert r.status_code == 200
        j = r.json()
        assert "items" in j and "total" in j
        assert isinstance(j["items"], list)
        assert j["total"] > 0, "expected some hazard rows from sheet"

    def test_filter_status_open(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/hazards?status=Open&limit=5", timeout=60)
        assert r.status_code == 200
        for x in r.json()["items"]:
            assert x["status"].lower() == "open"

    def test_filter_tingkat(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/hazards?tingkat=Rendah&limit=5", timeout=60)
        assert r.status_code == 200
        for x in r.json()["items"]:
            assert x["tingkat_resiko"].lower() == "rendah"

    def test_search(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/hazards?limit=1", timeout=60)
        items = r.json()["items"]
        if not items:
            pytest.skip("no data")
        term = (items[0]["deskripsi"][:5] or "a").lower()
        r2 = api_client.get(f"{base_url}/api/hazards?search={term}&limit=5", timeout=60)
        assert r2.status_code == 200

    def test_detail(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/hazards?limit=1", timeout=60)
        items = r.json()["items"]
        if not items:
            pytest.skip("no data")
        rid = items[0]["id"]
        r2 = api_client.get(f"{base_url}/api/hazards/{rid}", timeout=30)
        assert r2.status_code == 200
        assert r2.json()["id"] == rid

    def test_detail_404(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/hazards/99999999", timeout=30)
        assert r.status_code == 404

    def test_stats(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/hazards/stats", timeout=60)
        assert r.status_code == 200
        j = r.json()
        for k in ("total", "open", "close", "by_risk", "by_dept", "by_cat", "by_month"):
            assert k in j, f"missing {k}"

    def test_create_returns_503(self, api_client, base_url, auth_headers):
        payload = {"deskripsi": "TEST", "lokasi": "TEST"}
        r = api_client.post(f"{base_url}/api/hazards", json=payload, headers=auth_headers, timeout=30)
        assert r.status_code == 503
        assert "Google Sheets" in r.text or "belum terhubung" in r.text

    def test_pdf(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/hazards?limit=1", timeout=60)
        items = r.json()["items"]
        if not items:
            pytest.skip("no data")
        rid = items[0]["id"]
        r2 = api_client.get(f"{base_url}/api/hazards/{rid}/pdf", timeout=60)
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("application/pdf")
        assert r2.content[:4] == b"%PDF"


# --- Inspections ---
class TestInspections:
    def test_list(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/inspections?limit=5", timeout=60)
        assert r.status_code == 200
        j = r.json()
        assert "items" in j and "total" in j

    def test_filter_status(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/inspections?status=Approved&limit=5", timeout=60)
        assert r.status_code == 200
        for x in r.json()["items"]:
            assert x["status"].lower() == "approved"

    def test_stats(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/inspections/stats", timeout=60)
        assert r.status_code == 200
        j = r.json()
        for k in ("total", "approved", "pending", "by_type"):
            assert k in j

    def test_detail(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/inspections?limit=1", timeout=60)
        items = r.json()["items"]
        if not items:
            pytest.skip("no data")
        rid = items[0]["id"]
        r2 = api_client.get(f"{base_url}/api/inspections/{rid}", timeout=30)
        assert r2.status_code == 200
        j = r2.json()
        assert "columns" in j and "rows" in j

    def test_create_returns_503(self, api_client, base_url, auth_headers):
        r = api_client.post(f"{base_url}/api/inspections", json={"jenis": "TEST"}, headers=auth_headers, timeout=30)
        assert r.status_code == 503


# --- Meta ---
class TestMeta:
    def test_options(self, api_client, base_url):
        r = api_client.get(f"{base_url}/api/meta/options", timeout=60)
        assert r.status_code == 200
        j = r.json()
        for k in ("lokasi", "pic", "departemen", "jenis_inspeksi", "kategori_bahaya", "tingkat_resiko", "shift"):
            assert k in j
        assert "Rendah" in j["tingkat_resiko"]


# --- Upload / Files ---
class TestUpload:
    def test_upload_and_serve(self, api_client, base_url, auth_headers, auth_token):
        # small 1x1 PNG
        png = bytes.fromhex(
            "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6300010000000500010d0a2db40000000049454e44ae426082"
        )
        headers = {"Authorization": auth_headers["Authorization"]}
        files = {"file": ("t.png", png, "image/png")}
        r = requests.post(f"{base_url}/api/upload", headers=headers, files=files, timeout=90)
        assert r.status_code == 200, r.text
        j = r.json()
        assert "path" in j and "url" in j
        # Fetch via url (already contains token)
        r2 = requests.get(j["url"], timeout=60)
        assert r2.status_code == 200
        assert r2.headers.get("content-type", "").startswith("image/")

    def test_serve_requires_auth(self, api_client, base_url):
        r = requests.get(f"{base_url}/api/files/nonexistent.jpg", timeout=30)
        assert r.status_code == 401
