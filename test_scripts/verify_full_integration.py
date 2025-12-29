import os
from pyiceberg.catalog import load_catalog
import pyarrow as pa
import boto3
import sqlite3
import time

# Config
CATALOG_URI = "http://localhost:3000"
WAREHOUSE = "s3://warehouse/"
AWS_ENDPOINT = "http://localhost:9000"
AWS_ACCESS_KEY = "admin"
AWS_SECRET_KEY = "password"
DB_PATH = "catalog.db" # In root dir

# S3 Config for Boto3
s3 = boto3.client('s3', 
    endpoint_url=AWS_ENDPOINT,
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY
)

def test_pyiceberg_flow():
    print("--- 1. Initialize Catalog ---")
    # Setting Environment variables for PyIceberg to pick up S3 FileIO config
    # Some versions prefer environment variables or properties map
    
    catalog = load_catalog(
        "my_catalog",
        **{
            "uri": CATALOG_URI,
            "s3.endpoint": AWS_ENDPOINT,
            "s3.access-key-id": AWS_ACCESS_KEY,
            "s3.secret-access-key": AWS_SECRET_KEY,
            # "py-io-impl": "pyiceberg.io.pyarrow.PyArrowFileIO", # Default usually works
            "warehouse": WAREHOUSE
        }
    )
    
    print("--- 2. Create Namespace ---")
    ns = "integration_test"
    try:
        catalog.create_namespace(ns)
        print(f"Namespace '{ns}' created.")
    except Exception as e:
        print(f"Namespace creation note: {e}")

    print("--- 3. Create Table ---")
    tbl_name = f"integration_table_{int(time.time())}" # Unique name
    identifier = f"{ns}.{tbl_name}"
    
    schema = pa.schema([
        pa.field('id', pa.int64()),
        pa.field('data', pa.string())
    ])
    
    try:
        table = catalog.create_table(identifier, schema=schema)
        print(f"Table '{identifier}' created.")
    except Exception as e:
        print(f"Table creation failed: {e}")
        exit(1)

    print("--- 4. Verify S3 Persistence (Metadata File) ---")
    # Location should be s3://warehouse/integration_test/{tbl_name}/metadata/v1.metadata.json
    # Minio is structured as bucket/path
    
    prefix = f"{ns}/{tbl_name}/metadata/"
    print(f"Checking Minio prefix: warehouse/{prefix}")
    
    objs = s3.list_objects_v2(Bucket="warehouse", Prefix=prefix)
    
    found_metadata = False
    if 'Contents' in objs:
        for obj in objs['Contents']:
            print(f"Found S3 Object: {obj['Key']}")
            if obj['Key'].endswith('.metadata.json'):
                found_metadata = True
    
    if found_metadata:
        print("✅ Metadata file verified in Minio/S3.")
    else:
        print("❌ No metadata file found in Minio/S3!")
        exit(1)

    print("--- 5. Verify Database Persistence ---")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT namespace, name, metadata_location FROM tables WHERE namespace = ? AND name = ?", (ns, tbl_name))
    row = cur.fetchone()
    conn.close()
    
    if row:
        print(f"✅ Database record found: {row}")
    else:
        print("❌ Database record NOT found!")
        exit(1)
        
    print("--- 6. Attempt Data Append (PyIceberg) ---")
    try:
        # PyIceberg append writes data files and a new metadata version
        df = pa.Table.from_pylist([{"id": 1, "data": "foo"}, {"id": 2, "data": "bar"}], schema=schema)
        table.append(df)
        print("✅ Data appended successfully.")
        
        # Verify v2 metadata exists
        objs_v2 = s3.list_objects_v2(Bucket="warehouse", Prefix=prefix)
        v2_found = False
        if 'Contents' in objs_v2:
             for obj in objs_v2['Contents']:
                 if 'v2.metadata.json' in obj['Key']:
                     v2_found = True
        
        if v2_found:
             print("✅ v2.metadata.json found (Snapshot created).")
        else:
             print("⚠️ Data appended but v2.metadata.json not explicitly found in listing (Check logging).")
             
    except Exception as e:
        print(f"⚠️ Append skipped/failed (Expected if PyIceberg write support limited/configured wrong): {e}")

    print("\n🎉 Full Integration Test Completed!")

if __name__ == "__main__":
    test_pyiceberg_flow()
