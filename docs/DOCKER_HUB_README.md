# JS Iceberg Catalog

A lightweight, Node.js-based REST Catalog implementation for **Apache Iceberg**. This image provides a portable catalog server that uses **SQLite** for metadata persistence and supports **S3-compatible object storage** (AWS S3, Minio, etc.) for warehouse data.

Perfect for local development, testing Iceberg integrations, or lightweight production use cases where a JVM-based catalog is too heavy.

## Features

- **Standard Iceberg REST API Compliance**: Implements the Iceberg REST Open API Specification.
- **Optimistic Concurrency Control (OCC)**: Supports strict consistency checks for safe concurrent writes.
- **Atomic Transactions**: Supports multi-table transactions (commit / rollback).
- **Pagination**: Efficient listing of namespaces and tables.
- **S3 Integration**: Works natively with AWS S3, Minio, or any S3-compatible store.
- **Lightweight**: Built on Node.js 22 Alpine (~100MB).

## Quick Start

### 1. Run Standalone (with external S3)

If you already have S3 credentials:

```bash
docker run -d -p 3000:7654 \
  -e PORT=7654 \
  -e AWS_ACCESS_KEY_ID=your_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret \
  -e AWS_REGION=us-east-1 \
  -e WAREHOUSE_LOCATION=s3://my-warehouse-bucket/ \
  alexmerced/js-iceberg-catalog:latest
```

The catalog will be available at `http://localhost:3000`.

### 2. Run with Minio (Docker Compose)

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  catalog:
    image: alexmerced/js-iceberg-catalog:latest
    ports:
      - "3000:7654"
    environment:
      - NODE_ENV=production
      - PORT=7654
      - WAREHOUSE_LOCATION=s3://warehouse/
      - AWS_ACCESS_KEY_ID=minioadmin
      - AWS_SECRET_ACCESS_KEY=minioadmin
      - AWS_REGION=us-east-1
      - AWS_S3_ENDPOINT=http://minio:9000
    depends_on:
      - minio

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin
    command: server /data --console-address ":9001"

  # Optional: Create bucket automatically
  mc:
    image: minio/mc
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      /usr/bin/mc alias set myminio http://minio:9000 minioadmin minioadmin &&
      /usr/bin/mc mb myminio/warehouse || echo 'Bucket exists'
      "
```

Run with `docker-compose up`.

## Configuration (Environment Variables)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | The port the server listens on | `7654` |
| `NODE_ENV` | Environment mode (`production`, `development`) | `production` |
| `WAREHOUSE_LOCATION` | Base S3 path for the warehouse | `s3://warehouse/` |
| `AWS_ACCESS_KEY_ID` | S3 Access Key | `admin` |
| `AWS_SECRET_ACCESS_KEY` | S3 Secret Key | `password` |
| `AWS_REGION` | S3 Region | `us-east-1` |
| `AWS_S3_ENDPOINT` | Custom Endpoint (for Minio/Localstack) | (Optional) |

## Connecting with PyIceberg

This catalog works seamlessly with `pyiceberg`. Here is how to configure your client:

```python
from pyiceberg.catalog import load_catalog

# 1. Configure the Catalog
catalog = load_catalog(
    "my_catalog",
    **{
        "uri": "http://localhost:3000",
        "s3.endpoint": "http://localhost:9000", # If using Minio
        "s3.access-key-id": "minioadmin",
        "s3.secret-access-key": "minioadmin",
        "warehouse": "s3://warehouse/"
    }
)

# 2. Create a Namespace
catalog.create_namespace("demo")

# 3. Create a Table
import pyarrow as pa
schema = pa.schema([
    pa.field('id', pa.int64()),
    pa.field('message', pa.string())
])

table = catalog.create_table(
    identifier="demo.logs",
    schema=schema
)

# 4. Append Data
df = pa.Table.from_pylist([
    {"id": 1, "message": "Hello Iceberg!"},
    {"id": 2, "message": "Running from Docker!"}
])
table.append(df)

# 5. Read Data
print(table.scan().to_arrow().to_pylist())
```

## connecting with Spark

If you are using Spark, include the Iceberg runtime jars and configure the catalog:

```bash
spark-shell \
    --packages org.apache.iceberg:iceberg-spark-runtime-3.5_2.12:1.6.0,org.apache.hadoop:hadoop-aws:3.3.4 \
    --conf spark.sql.catalog.my_catalog=org.apache.iceberg.spark.SparkCatalog \
    --conf spark.sql.catalog.my_catalog.type=rest \
    --conf spark.sql.catalog.my_catalog.uri=http://localhost:3000 \
    --conf spark.sql.catalog.my_catalog.warehouse=s3://warehouse/ \
    --conf spark.sql.catalog.my_catalog.io-impl=org.apache.iceberg.aws.s3.S3FileIO \
    --conf spark.hadoop.fs.s3a.endpoint=http://localhost:9000 \
    --conf spark.hadoop.fs.s3a.access.key=minioadmin \
    --conf spark.hadoop.fs.s3a.secret.key=minioadmin \
    --conf spark.hadoop.fs.s3a.path.style.access=true
```

## Persistence

- **Catalog Metadata**: By default, the catalog stores its state in a SQLite database file inside the container (`/home/node/app/catalog.db`). For persistence across restarts, mount a volume:
  `-v $(pwd)/data:/home/node/app/data` (You may need to adjust code to look for DB in a persistent path or just mount the whole app dir, but be careful of overriding code. Better to accept ephemeral state for testing or use a committed image).
- **Data (S3)**: Data is stored in your S3 bucket/Minio volume.

## License

MIT
