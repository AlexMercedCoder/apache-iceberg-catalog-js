import requests
import json
import time

CATALOG_URL = "http://localhost:3000/v1/catalogs"
NS = "page_ns_v2"
HEADERS = {"Content-Type": "application/json"}

def setup():
    # Create Namespace
    res = requests.post(f"{CATALOG_URL}/namespaces", json={"namespace": [NS]}, headers=HEADERS)
    print(f"Create Namespace Status: {res.status_code}")
    
def setup():
    # Create Namespace
    res = requests.post(f"{CATALOG_URL}/namespaces", json={"namespace": [NS]}, headers=HEADERS)
    print(f"Create Namespace Status: {res.status_code}")
    if res.status_code != 200:
        print(f"Create Namespace Error: {res.text}")
        # Proceeding might be useless but let's see.

    # Create 15 tables
    for i in range(15):
        res = requests.post(f"{CATALOG_URL}/namespaces/{NS}/tables", json={ "name": f"table_{i}", "schema": {"type": "struct", "fields": []} }, headers=HEADERS)
        if res.status_code != 200:
            print(f"Failed to create table_{i}: {res.text}")

def test_pagination():
    print("Testing Pagination...")
    
    # 1. First Page (Limit 10)
    resp = requests.get(f"{CATALOG_URL}/namespaces/{NS}/tables?pageSize=10", headers=HEADERS)
    if resp.status_code != 200:
        print(f"ListTables Failed: {resp.status_code}, {resp.text}")
        exit(1)

    data = resp.json()
    items = data.get('identifiers', [])
    token = data.get('next-page-token')
    
    print(f"Page 1 Count: {len(items)}")
    if len(items) != 10:
        print(f"❌ Expected 10 items, got {len(items)}")
        exit(1)
        
    if not token:
        print("❌ Expected next-page-token, got None")
        exit(1)
        
    print(f"Page 1 Token: {token}")

    # 2. Second Page (Limit 10, expecting 5 remaining)
    resp2 = requests.get(f"{CATALOG_URL}/namespaces/{NS}/tables?pageSize=10&pageToken={token}", headers=HEADERS)
    data2 = resp2.json()
    items2 = data2.get('identifiers', [])
    token2 = data2.get('next-page-token')
    
    print(f"Page 2 Count: {len(items2)}")
    if len(items2) != 5:
        print(f"❌ Expected 5 items on page 2, got {len(items2)}")
        exit(1)
        
    if token2:
         print(f"❌ Expected no next-page-token on last page, got {token2}")
         exit(1)

    print("✅ Pagination Verified (15 items -> 10 + 5)")

if __name__ == "__main__":
    try:
        setup()
        test_pagination()
    except Exception as e:
        print(f"Test Failed: {e}")
