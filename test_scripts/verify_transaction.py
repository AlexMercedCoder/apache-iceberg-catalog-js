import requests
import json

CATALOG_URL = "http://localhost:3000/v1/catalogs"
NS = "tx_ns"
TABLE1 = "tx_table_1"
TABLE2 = "tx_table_2"
HEADERS = {"Content-Type": "application/json"}

def setup():
    requests.post(f"{CATALOG_URL}/namespaces", json={"namespace": [NS]}, headers=HEADERS)
    requests.post(f"{CATALOG_URL}/namespaces/{NS}/tables", json={ "name": TABLE1, "schema": {"type": "struct", "fields": []} }, headers=HEADERS)
    requests.post(f"{CATALOG_URL}/namespaces/{NS}/tables", json={ "name": TABLE2, "schema": {"type": "struct", "fields": []} }, headers=HEADERS)

def test_transaction():
    print("Testing Transaction Atomicity...")
    
    # Payload: Update Table 1 (Valid) AND Table 2 (Invalid Requirement -> Fail)
    # Expectation: Table 1 should NOT be updated because Table 2 fails.
    
    req_fail = {
        "table-changes": [
            {
                "identifier": {"namespace": [NS], "name": TABLE1},
                "requirements": [],
                "updates": [{"action": "set-properties", "updates": {"tx-prop": "set"}}]
            },
            {
                "identifier": {"namespace": [NS], "name": TABLE2},
                "requirements": [{"type": "assert-current-snapshot-id", "snapshot-id": 999999}], # FAIL
                "updates": [{"action": "set-properties", "updates": {"tx-prop": "set"}}]
            }
        ]
    }
    
    resp = requests.post(f"{CATALOG_URL}/transactions/commit", json=req_fail, headers=HEADERS)
    if resp.status_code == 409:
        print("✅ Transaction failed with 409 as expected.")
    else:
        print(f"❌ Transaction did not fail as expected. Status: {resp.status_code}")
        exit(1)
        
    # Verify Table 1 was NOT updated
    resp1 = requests.get(f"{CATALOG_URL}/namespaces/{NS}/tables/{TABLE1}", headers=HEADERS)
    meta1 = resp1.json()['metadata']
    if 'tx-prop' not in meta1.get('properties', {}):
        print("✅ Atomicity Verified: Table 1 was rolled back.")
    else:
        print("❌ Atomicity Failed: Table 1 was updated despite transaction failure.")
        exit(1)

    # Success Case
    req_success = {
        "table-changes": [
             {
                "identifier": {"namespace": [NS], "name": TABLE1},
                "requirements": [],
                "updates": [{"action": "set-properties", "updates": {"success": "true"}}]
            }
        ]
    }
    resp = requests.post(f"{CATALOG_URL}/transactions/commit", json=req_success, headers=HEADERS)
    if resp.status_code == 204:
        print("✅ Valid Transaction Succeeded.")
    else:
        print(f"❌ Valid Transaction Failed: {resp.text}")

if __name__ == "__main__":
    try:
        setup()
        test_transaction()
    except Exception as e:
        print(f"Test Failed: {e}")
