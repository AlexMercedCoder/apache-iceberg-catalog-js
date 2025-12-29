# Dremio Integration Guide

**Dremio** supports the Iceberg REST Catalog protocol natively, allowing you to query tables managed by the JS Iceberg Catalog directly.

## Steps

1.  **Log in to Dremio**.
2.  Click **Add Source** (Plus icon next to Sources).
3.  Select **Iceberg**.
4.  **General Tab**:
    - **Name**: `my-catalog` (or any name)
    - **Catalog Type**: Select `REST` from the dropdown.
    - **REST URL**: `http://<your-docker-host-ip>:7654/` (Do not use `localhost` if Dremio runs in a container/VM separate from the catalog).
5.  **Storage Tab**:
    - **Authentication**: `AWS Access Key`
    - **Access Key ID**: `minioadmin` (or your S3 key)
    - **Secret Access Key**: `minioadmin` (or your S3 secret)
    - **Root Path**: `/` (or your specific warehouse prefix)
6.  **Advanced Options** (Required for Minio/Localstack):
    - Check **Enable compatibility mode** (for older S3 implementations, if needed).
    - Add Property: `fs.s3a.endpoint` = `http://minio:9000`
    - Add Property: `fs.s3a.path.style.access` = `true`
7.  Click **Save**.

## Usage
Once connected, you will see the catalog in your Dremio datasets list. You can browse namespaces and tables, and query them using Dremio SQL:

```sql
SELECT * FROM "my-catalog".integration_test.my_table
```
