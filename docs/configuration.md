# Configuration Reference

The JS Iceberg Catalog is configured primarily through **Environment Variables**.

## Server Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | The HTTP port the server listens on. | `7654` | No |
| `NODE_ENV` | Application mode (`production`, `development`). | `production` | No |

## Warehouse / Storage Configuration
These settings determine where the catalog stores and reads Iceberg metadata and data files.

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `WAREHOUSE_LOCATION` | The base S3 path where tables will be stored. Must end with `/`. | `s3://warehouse/` | **Yes** |
| `AWS_ACCESS_KEY_ID` | Access Key for the S3-compatible store. | `admin` | **Yes** |
| `AWS_SECRET_ACCESS_KEY` | Secret Key for the S3-compatible store. | `password` | **Yes** |
| `AWS_REGION` | AWS Region for the bucket. | `us-east-1` | No |
| `AWS_S3_ENDPOINT` | Custom Endpoint URL. Use this for **Minio**, **Localstack**, or on-prem S3. | - | No (unless Minio) |

### Example: Minio Configuration (Docker Compose)
```yaml
environment:
  PORT: 7654
  WAREHOUSE_LOCATION: s3://my-data/
  AWS_ACCESS_KEY_ID: minioadmin
  AWS_SECRET_ACCESS_KEY: minioadmin
  AWS_REGION: us-east-1
  AWS_S3_ENDPOINT: http://minio:9000
```
