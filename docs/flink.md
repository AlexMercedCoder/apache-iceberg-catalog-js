# Apache Flink Integration Guide

Connect **Apache Flink** to the JS Iceberg Catalog using the Flink SQL Client.

## Prerequisites
- Flink 1.16+
- `iceberg-flink-runtime` jar (matching your Flink version)
- `flink-s3-fs-hadoop` plugin

## SQL Client Configuration
Start the Flink SQL Client with the Iceberg jar:

```bash
./bin/sql-client.sh embedded -j iceberg-flink-runtime-1.16-1.6.0.jar
```

## Create Catalog

Execute the following SQL to register the REST catalog:

```sql
CREATE CATALOG my_iceberg WITH (
  'type' = 'iceberg',
  'catalog-type' = 'rest',
  'uri' = 'http://localhost:3000',
  'warehouse' = 's3://warehouse/',
  'io-impl' = 'org.apache.iceberg.aws.s3.S3FileIO',
  's3.endpoint' = 'http://localhost:9000',
  's3.access-key-id' = 'minioadmin',
  's3.secret-access-key' = 'minioadmin',
  's3.path-style-access' = 'true'
);

USE CATALOG my_iceberg;
```

## Operations

```sql
-- Create Table
CREATE TABLE flink_table (
    id BIGINT,
    data STRING
);

-- Insert (Streaming or Batch)
INSERT INTO flink_table VALUES (1, 'Hello Flink');

-- Read
SELECT * FROM flink_table;
```
