import requests
import json
import time

CATALOG_URL = "http://localhost:3000/v1/catalogs"
NS = "occ_test_ns"
TABLE = "occ_test_table"
HEADERS = {"Content-Type": "application/json"}

def setup():
    # Create Namespace
    requests.post(f"{CATALOG_URL}/namespaces", json={"namespace": [NS]}, headers=HEADERS)
    # Create Table
    requests.post(f"{CATALOG_URL}/namespaces/{NS}/tables", json={
        "name": TABLE,
        "schema": {"type": "struct", "fields": [{"id": 1, "name": "id", "type": "int", "required": True}]}
    }, headers=HEADERS)

def test_occ_failure():
    print("Testing OCC Failure...")
    
    # 1. Get Current Metadata to find current-snapshot-id (should be -1)
    resp = requests.get(f"{CATALOG_URL}/namespaces/{NS}/tables/{TABLE}", headers=HEADERS)
    metadata = resp.json()['metadata']
    current_snap = metadata['current-snapshot-id']
    print(f"Current Snapshot: {current_snap}")

    # 2. Try Update with CORRECT assert (Should Succeed)
    req_success = {
        "requirements": [
            {"type": "assert-current-snapshot-id", "snapshot-id": current_snap}
        ],
        "updates": [
            {"action": "set-properties", "updates": {"test-prop": "v1"}}
        ]
    }
    resp = requests.post(f"{CATALOG_URL}/namespaces/{NS}/tables/{TABLE}", json=req_success, headers=HEADERS)
    if resp.status_code == 200:
        print("✅ Correct Requirement Succeeded")
    else:
        print(f"❌ Correct Requirement Failed: {resp.text}")
        exit(1)

    # 3. Try Update with WRONG assert (Should Fail with 409)
    req_fail = {
        "requirements": [
            {"type": "assert-current-snapshot-id", "snapshot-id": 999999} # Wrong ID
        ],
        "updates": [
             {"action": "set-properties", "updates": {"test-prop": "v2"}}
        ]
    }
    resp = requests.post(f"{CATALOG_URL}/namespaces/{NS}/tables/{TABLE}", json=req_fail, headers=HEADERS)
    if resp.status_code == 409:
        print("✅ Incorrect Requirement Failed (409 Conflict) as expected")
    else:
        print(f"❌ Incorrect Requirement did NOT fail correctly. Status: {resp.status_code}, Body: {resp.text}")
        exit(1)

if __name__ == "__main__":
    try:
        setup()
        test_occ_failure()
    except Exception as e:
        print(f"Test Failed: {e}")
