# JS Iceberg Catalog

**A lightweight, portable, Node.js-based implementation of the Apache Iceberg REST Catalog Specification.**

This project provides a fully functional Iceberg Catalog server that uses **SQLite** for catalog state and **S3-compatible object storage** (AWS S3, Minio, etc.) for metadata and data files. It is designed for local development, CI/CD testing, and lightweight production use cases where running a JVM-based catalog is unnecessary.

---

## 🚀 Key Features

- **Standard Compliance**: Implements the [Iceberg REST OpenAPI Specification](https://github.com/apache/iceberg/tree/master/open-api).
- **Concurrency Control**: Supports **Optimistic Concurrency Control (OCC)** to prevent data loss during concurrent writes.
- **Atomic Transactions**: Supports multi-table ACID transactions.
- **Pagination**: Efficiently lists thousands of namespaces and tables.
- **Lightweight**: Built on Node.js 22 Alpine, producing a tiny Docker footprint compared to Java alternatives.

---

## 📦 Quick Start

### Option 1: Docker (Recommended)

The easiest way to run the catalog is via Docker.

```bash
docker run -p 3000:7654 \
  -e WAREHOUSE_LOCATION=s3://my-bucket/warehouse/ \
  -e AWS_ACCESS_KEY_ID=admin \
  -e AWS_SECRET_ACCESS_KEY=password \
  -e AWS_REGION=us-east-1 \
  alexmerced/js-iceberg-catalog:latest
```

The server will start on port `3000`.

### Option 2: Local Node.js

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure**:
   Create a `.env` file or set environment variables (see [Configuration](docs/configuration.md)).

3. **Start**:
   ```bash
   npm start
   ```

---

## 📚 Documentation

We have detailed guides for connecting various engines and tools:

- **[Configuration Guide](docs/configuration.md)**: Full list of environment variables.
- **[PyIceberg Guide](docs/pyiceberg.md)**: How to connect using Python.
- **[Apache Spark Guide](docs/spark.md)**: Spark SQL configuration.
- **[Apache Flink Guide](docs/flink.md)**: Flink SQL configuration.
- **[Dremio Guide](docs/dremio.md)**: Adding the catalog to Dremio.
- **[Trino Guide](docs/trino.md)**: Trino connector setup.
- **[Demo / Experimentation Guide](docs/demo-guide.md)**: Step-by-step local lab with Docker & Spark.
- **[API Limitations](docs/limitations.md)**: Known constraints.

---

## 🛠️ API Overview

The server exposes the standard Iceberg REST API. 

- **Swagger UI**: Available at `http://localhost:3000/api-docs` when running locally.
- **Namespace UI**: A simple management UI is available at `http://localhost:3000/ui`.

### Core Endpoints

<details>
<summary>Click to view key endpoints</summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/v1/config` | Get catalog config |
| `POST` | `/v1/oauth/tokens` | Get auth token |
| `GET` | `/v1/{prefix}/namespaces` | List namespaces |
| `POST` | `/v1/{prefix}/namespaces` | Create namespace |
| `GET` | `/v1/{prefix}/namespaces/{ns}/tables` | List tables |
| `POST` | `/v1/{prefix}/namespaces/{ns}/tables` | Create table |
| `GET` | `/v1/{prefix}/namespaces/{ns}/tables/{tbl}` | Load table metadata |
| `POST` | `/v1/{prefix}/namespaces/{ns}/tables/{tbl}` | Commit updates |
| `POST` | `/v1/{prefix}/transactions/commit` | Commit multi-table transaction |

</details>

---

## 🧪 Development

### Running Tests
The project includes a suite of Python-based verification scripts in `test_scripts/` to validate spec compliance.

```bash
python3 test_scripts/verify_pagination.py
python3 test_scripts/verify_full_integration.py
```

### Logging
Logs are written to `app.log` and the console using Winston.

---

## License

ISC
