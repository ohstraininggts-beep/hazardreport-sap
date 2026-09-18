#!/usr/bin/env python3
"""
Backend API tests for GTS Safety Portal
Tests the new/changed inspection endpoints
"""
import requests
import json
import sys

# Use internal backend URL for testing
BASE_URL = "http://localhost:8001/api"

# Test credentials
AUTH_USERNAME = "Habel Lolopayung"
AUTH_PASSWORD = "M0303250220"
MON_USERNAME = "admin"
MON_PASSWORD = "123gtspastibisa"

def print_test(name):
    print(f"\n{'='*60}")
    print(f"TEST: {name}")
    print('='*60)

def print_result(success, message, response=None):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if response:
        print(f"Status: {response.status_code}")
        try:
            print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)[:500]}")
        except:
            print(f"Response text: {response.text[:500]}")
    print()

def test_auth_login():
    """Test 1: Get Bearer token via POST /api/auth/login"""
    print_test("POST /api/auth/login - Get Bearer token")
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"username": AUTH_USERNAME, "password": AUTH_PASSWORD},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "token" in data and "user" in data:
                print_result(True, "Login successful, token received", response)
                return data["token"]
            else:
                print_result(False, "Login response missing token or user", response)
                return None
        else:
            print_result(False, f"Login failed with status {response.status_code}", response)
            return None
    except Exception as e:
        print_result(False, f"Login request failed: {e}")
        return None

def test_create_inspection(token):
    """Test 2: POST /api/inspections - Create ONE inspection with minimal checklist"""
    print_test("POST /api/inspections - Create inspection with checklist form")
    
    if not token:
        print_result(False, "No auth token available, skipping test")
        return False
    
    # Minimal checklist form as specified in review request
    inspection_data = {
        "jenis": "PRE JOB INSPECTION - POS SAMPEL (SAMPLE HOUSE)",
        "shift": "Shift Siang",
        "email": "test@gts.com",
        "tanggal": "18/09/2026",
        "waktu": "08:00",
        "status": "Pending",
        "form": {
            "formCode": "GTS-FR-SFT-05.07-76",
            "formTitle": "PRE JOB INSPECTION",
            "formType": "checklist",
            "hasNA": True,
            "lokasi": "AREA PIT",
            "lokasiDetail": "backend test",
            "categories": [
                {
                    "title": "A. Lingkungan",
                    "questions": [
                        {
                            "text": "Apakah area pengambilan sampel dalam kondisi aman?",
                            "answer": "YA"
                        }
                    ]
                }
            ],
            "temuan": "backend automated test row"
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/inspections",
            json=inspection_data,
            headers={"Authorization": f"Bearer {token}"},
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok") == True:
                print_result(True, "Inspection created successfully", response)
                return True
            else:
                print_result(False, "Response missing 'ok: true'", response)
                return False
        else:
            print_result(False, f"Create inspection failed with status {response.status_code}", response)
            return False
    except Exception as e:
        print_result(False, f"Create inspection request failed: {e}")
        return False

def test_list_inspections(token):
    """Test 3: GET /api/inspections?limit=5 - List inspections"""
    print_test("GET /api/inspections?limit=5 - List inspections")
    
    if not token:
        print_result(False, "No auth token available, skipping test")
        return None
    
    try:
        response = requests.get(
            f"{BASE_URL}/inspections?limit=5",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "total" in data and "items" in data:
                total = data["total"]
                items = data["items"]
                
                # Check if total is an integer
                if not isinstance(total, int):
                    print_result(False, f"'total' is not an integer: {type(total)}", response)
                    return None
                
                # Check if items is a list
                if not isinstance(items, list):
                    print_result(False, f"'items' is not a list: {type(items)}", response)
                    return None
                
                # Check if at least one item has required fields
                if len(items) > 0:
                    item = items[0]
                    required_fields = ["id", "jenis", "status", "form_type", "row_count", "departemen", "pelaksana"]
                    missing_fields = [f for f in required_fields if f not in item]
                    
                    if missing_fields:
                        print_result(False, f"Item missing fields: {missing_fields}", response)
                        return None
                    
                    # Check if at least one item has non-empty form_type
                    has_form_type = any(x.get("form_type") in ["checklist", "scoring", "preplab", "table"] for x in items)
                    if not has_form_type:
                        print_result(False, "No item has a valid form_type (checklist/scoring/preplab/table)", response)
                        return None
                    
                    print_result(True, f"List inspections successful: {total} total, {len(items)} items returned", response)
                    return items[0]["id"]  # Return newest ID for next test
                else:
                    print_result(False, "No items returned in list", response)
                    return None
            else:
                print_result(False, "Response missing 'total' or 'items'", response)
                return None
        else:
            print_result(False, f"List inspections failed with status {response.status_code}", response)
            return None
    except Exception as e:
        print_result(False, f"List inspections request failed: {e}")
        return None

def test_get_inspection_detail(token, inspection_id):
    """Test 4: GET /api/inspections/{id} - Get inspection detail"""
    print_test(f"GET /api/inspections/{inspection_id} - Get inspection detail")
    
    if not token:
        print_result(False, "No auth token available, skipping test")
        return False
    
    if not inspection_id:
        print_result(False, "No inspection ID available, skipping test")
        return False
    
    try:
        response = requests.get(
            f"{BASE_URL}/inspections/{inspection_id}",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "form" in data:
                form = data["form"]
                if isinstance(form, dict) and "formType" in form:
                    form_type = form["formType"]
                    
                    # For checklist, verify categories and questions exist
                    if form_type == "checklist":
                        if "categories" in form and isinstance(form["categories"], list):
                            has_questions = any(
                                "questions" in cat and isinstance(cat["questions"], list)
                                for cat in form["categories"]
                            )
                            if has_questions:
                                print_result(True, f"Inspection detail retrieved with nested form (type: {form_type})", response)
                                return True
                            else:
                                print_result(False, "Checklist form missing questions in categories", response)
                                return False
                        else:
                            print_result(False, "Checklist form missing categories", response)
                            return False
                    else:
                        print_result(True, f"Inspection detail retrieved with nested form (type: {form_type})", response)
                        return True
                else:
                    print_result(False, "Form object missing formType", response)
                    return False
            else:
                print_result(False, "Response missing 'form' object", response)
                return False
        else:
            print_result(False, f"Get inspection detail failed with status {response.status_code}", response)
            return False
    except Exception as e:
        print_result(False, f"Get inspection detail request failed: {e}")
        return False

def test_monitoring_login():
    """Test 5: POST /api/monitoring/login - Test admin login and wrong password"""
    print_test("POST /api/monitoring/login - Admin login")
    
    # Test 5a: Correct admin login
    try:
        response = requests.post(
            f"{BASE_URL}/monitoring/login",
            json={"username": MON_USERNAME, "password": MON_PASSWORD},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if "token" in data and "user" in data:
                user = data["user"]
                if user.get("role") == "master":
                    print_result(True, "Admin login successful with role=master", response)
                    admin_token = data["token"]
                else:
                    print_result(False, f"Admin user role is not 'master': {user.get('role')}", response)
                    return None
            else:
                print_result(False, "Admin login response missing token or user", response)
                return None
        else:
            print_result(False, f"Admin login failed with status {response.status_code}", response)
            return None
    except Exception as e:
        print_result(False, f"Admin login request failed: {e}")
        return None
    
    # Test 5b: Wrong password
    print_test("POST /api/monitoring/login - Wrong password")
    try:
        response = requests.post(
            f"{BASE_URL}/monitoring/login",
            json={"username": MON_USERNAME, "password": "salah"},
            timeout=10
        )
        
        if response.status_code == 401:
            print_result(True, "Wrong password correctly rejected with 401", response)
        else:
            print_result(False, f"Wrong password should return 401, got {response.status_code}", response)
    except Exception as e:
        print_result(False, f"Wrong password test request failed: {e}")
    
    return admin_token

def test_monitoring_inspections(mon_token):
    """Test 6: GET /api/monitoring/inspections - Get monitoring inspections"""
    print_test("GET /api/monitoring/inspections - Get monitoring inspections")
    
    if not mon_token:
        print_result(False, "No monitoring token available, skipping test")
        return False
    
    try:
        response = requests.get(
            f"{BASE_URL}/monitoring/inspections",
            headers={"Authorization": f"Bearer {mon_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            required_fields = ["total", "approved", "pending", "items"]
            missing_fields = [f for f in required_fields if f not in data]
            
            if missing_fields:
                print_result(False, f"Response missing fields: {missing_fields}", response)
                return False
            
            # Check if total, approved, pending are integers
            if not all(isinstance(data[f], int) for f in ["total", "approved", "pending"]):
                print_result(False, "total/approved/pending are not all integers", response)
                return False
            
            # Check if items is a list
            if not isinstance(data["items"], list):
                print_result(False, f"'items' is not a list: {type(data['items'])}", response)
                return False
            
            print_result(True, f"Monitoring inspections retrieved: total={data['total']}, approved={data['approved']}, pending={data['pending']}", response)
            return True
        else:
            print_result(False, f"Get monitoring inspections failed with status {response.status_code}", response)
            return False
    except Exception as e:
        print_result(False, f"Get monitoring inspections request failed: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("GTS SAFETY PORTAL - BACKEND API TESTS")
    print("="*60)
    
    results = {
        "auth_login": False,
        "create_inspection": False,
        "list_inspections": False,
        "get_inspection_detail": False,
        "monitoring_login": False,
        "monitoring_inspections": False
    }
    
    # Test 1: Auth login
    auth_token = test_auth_login()
    results["auth_login"] = auth_token is not None
    
    # Test 2: Create inspection (ONLY ONCE)
    if auth_token:
        results["create_inspection"] = test_create_inspection(auth_token)
    
    # Test 3: List inspections
    inspection_id = None
    if auth_token:
        inspection_id = test_list_inspections(auth_token)
        results["list_inspections"] = inspection_id is not None
    
    # Test 4: Get inspection detail
    if auth_token and inspection_id:
        results["get_inspection_detail"] = test_get_inspection_detail(auth_token, inspection_id)
    
    # Test 5: Monitoring login (admin + wrong password)
    mon_token = test_monitoring_login()
    results["monitoring_login"] = mon_token is not None
    
    # Test 6: Monitoring inspections
    if mon_token:
        results["monitoring_inspections"] = test_monitoring_inspections(mon_token)
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    for test_name, passed in results.items():
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    print(f"\nTotal: {passed}/{total} tests passed")
    print("="*60)
    
    return 0 if passed == total else 1

if __name__ == "__main__":
    sys.exit(main())
