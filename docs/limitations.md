# Limitations

While `js-iceberg-catalog` implements the core Iceberg REST API, please be aware of the following limitations inherent to its lightweight design.

## 1. Concurrency & Throughput
- **Single Node**: The catalog is designed as a single Node.js process. It handles concurrent requests via the event loop but is not designed for massive high-throughput production workloads.
- **SQLite Locking**: The backing store is SQLite. While write-ahead logging (WAL) handles basic concurrency, heavy concurrent write loads may experience contention.

## 2. Authentication
- **Basic Auth**: Currently, the catalog uses a placeholder OAuth flow (`dummy-token`) effectively operating in "No Auth" or simple "Client Credentials" mode. It relies on internal trust networks (e.g., inside a VPC or Docker network). 
- **RBAC**: There is no built-in Role-Based Access Control or user management.

## 3. Storage
- **S3 Only**: Primary support is for S3 API compatible storage. Other FileIO implementations (HDFS, Azure Native) are not directly supported by the catalog's internal metadata writer, though clients can use them if the catalog just passes through the location.

## 4. Iceberg Spec Completeness
- **Metrics**: Endpoints for reporting metrics are stubbed (return 204) but do not persist or analyze metric data.
- **View Spec**: View support is implemented but may lag behind the absolute latest polling of the spec compared to tables.
- **Multi-Table Transactions**: Implemented via SQLite transactions, but complex edge cases in rollback (e.g., cleaning up orphan S3 files created during a failed transaction) are not fully handled.
