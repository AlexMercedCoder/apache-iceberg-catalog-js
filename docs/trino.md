# Trino Integration Guide

**Trino** uses the `iceberg` connector with the `rest` catalog type.

## Configuration File

Create a catalog property file, e.g., `etc/catalog/iceberg.properties`:

```properties
connector.name=iceberg
iceberg.catalog.type=rest
iceberg.rest-catalog.uri=http://localhost:3000
iceberg.rest-catalog.security=NONE

# S3 / Minio Configuration
fs.native-s3.enabled=true
s3.endpoint=http://localhost:9000
s3.aws-access-key=minioadmin
s3.aws-secret-key=minioadmin
s3.region=us-east-1
s3.path-style-access=true
```

## Using Trino CLI

```bash
trino --server localhost:8080 --catalog iceberg --schema default
```

## SQL Queries

```sql
SHOW SCHEMAS;

CREATE TABLE iceberg.test_ns.trino_table (
    id BIGINT,
    msg VARCHAR
);

INSERT INTO iceberg.test_ns.trino_table VALUES (100, 'Trino Insert');

SELECT * FROM iceberg.test_ns.trino_table;
```
