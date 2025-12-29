# PyIceberg Integration Guide

Reference guide for connecting **PyIceberg** (the official Python SDK for Iceberg) to this catalog.

## Prerequisites
- Python 3.8+
- `pip install pyiceberg[s3fs,pyarrow]`

## connection Setup

PyIceberg uses a `~/.pyiceberg.yaml` file or programmatic configuration.

### Option 1: Programmatic (Recommended for Scripts)

```python
from pyiceberg.catalog import load_catalog

catalog = load_catalog(
    "my_catalog",
    **{
        "type": "rest",
        "uri": "http://localhost:3000",
        
        # S3 / Minio Configuration
        "s3.endpoint": "http://localhost:9000",
        "s3.access-key-id": "minioadmin",
        "s3.secret-access-key": "minioadmin",
        "s3.region": "us-east-1",
        
        # Warehouse Base Path
        "warehouse": "s3://warehouse/" 
    }
)
```

### Option 2: Config File (`~/.pyiceberg.yaml`)

```yaml
catalogs:
  default:
    uri: http://localhost:3000
    type: rest
    s3.endpoint: http://localhost:9000
    s3.access-key-id: minioadmin
    s3.secret-access-key: minioadmin
    warehouse: s3://warehouse/
```

Then in python:
```python
from pyiceberg.catalog import load_catalog
catalog = load_catalog("default")
```

## Common Operations

### Create Namespace
```python
catalog.create_namespace("analytics")
```

### Create Table
```python
import pyarrow as pa

schema = pa.schema([
    pa.field('id', pa.int64()),
    pa.field('event_time', pa.timestamp('us')),
    pa.field('payload', pa.string())
])

table = catalog.create_table(
    identifier="analytics.logs",
    schema=schema
)
```

### Append Data
```python
import datetime

data = [
    {"id": 1, "event_time": datetime.datetime.now(), "payload": "login_attempt"}
]
df = pa.Table.from_pylist(data, schema=schema)
table.append(df)
```

### Query Data (Scan)
```python
con = table.scan(
    row_filter="id > 0"
).to_duckdb(table_name="logs")

con.sql("SELECT * FROM logs").show()
```
