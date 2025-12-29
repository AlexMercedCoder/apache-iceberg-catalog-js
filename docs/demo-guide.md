# Local Iceberg Experimentation Guide

This guide walks you through using the `docker-compose.yml` environment to experiment with Apache Iceberg tables locally.

## What's Included?

The Docker Compose environment spins up three services:
1.  **Catalog (`alexmerced/js-iceberg-catalog`)**: The REST catalog server running at `http://localhost:7654` (and `3000`).
2.  **Minio (`minio/minio`)**: S3-compatible storage for your data, accessible at `http://localhost:9001` (Console) and `9000` (API).
3.  **Spark (`alexmerced/spark35notebook`)**: A Spark 3.5 environment with Jupyter capabilities, accessible at `http://localhost:8888`.

## Step 1: Start the Environment

Run the following command in the root of the project:

```bash
docker-compose up -d
```

Wait a few seconds for all services to initialize.

## Step 2: Access Minio

1.  Open your browser to [http://localhost:9001](http://localhost:9001).
2.  Login with:
    - **User**: `admin`
    - **Password**: `password`
3.  You should see a `warehouse` bucket already created. This is where your Iceberg data will live.

## Step 3: Use Spark (via Jupyter Notebook)

The `spark` container runs a Jupyter environment pre-configured with the necessary Iceberg and AWS libraries.

1.  Open [http://localhost:8888](http://localhost:8888).
2.  Create a new Python notebook.
3.  **Initialize Spark**:
    Copy and run the following code to start a Spark Session configured for our catalog:

    ```python
    from pyspark.sql import SparkSession
    
    spark = SparkSession.builder \
        .appName("IcebergDemo") \
        .config("spark.sql.extensions", "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions") \
        .config("spark.sql.catalog.my_catalog", "org.apache.iceberg.spark.SparkCatalog") \
        .config("spark.sql.catalog.my_catalog.type", "rest") \
        .config("spark.sql.catalog.my_catalog.uri", "http://catalog:7654") \
        .config("spark.sql.catalog.my_catalog.warehouse", "s3://warehouse/") \
        .config("spark.sql.catalog.my_catalog.io-impl", "org.apache.iceberg.aws.s3.S3FileIO") \
        .config("spark.hadoop.fs.s3a.endpoint", "http://minio:9000") \
        .config("spark.hadoop.fs.s3a.access.key", "admin") \
        .config("spark.hadoop.fs.s3a.secret.key", "password") \
        .config("spark.hadoop.fs.s3a.path.style.access", "true") \
        .config("spark.hadoop.fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem") \
        .getOrCreate()
        
    print("Spark Running!")
    ```

## Step 4: Run Iceberg Operations

Now you can run SQL commands directly from Spark.

### Create a Namespace and Table
```python
spark.sql("CREATE NAMESPACE IF NOT EXISTS my_catalog.demo")
spark.sql("""
    CREATE TABLE my_catalog.demo.nyc_taxis (
        vendor_id bigint,
        trip_id bigint,
        trip_distance float,
        fare_amount float,
        store_and_fwd_flag string
    ) PARTITIONED BY (vendor_id);
""")
```

### Insert Data
```python
spark.sql("""
    INSERT INTO my_catalog.demo.nyc_taxis VALUES 
    (1, 1000371, 1.8, 15.32, 'N'), 
    (2, 1000372, 2.5, 22.15, 'N'), 
    (2, 1000373, 0.9, 9.01, 'N'), 
    (1, 1000374, 1.1, 6.00, 'Y')
""")
```

### Query Data
```python
df = spark.sql("SELECT * FROM my_catalog.demo.nyc_taxis")
df.show()
```

### Evolve Schema (Add Column)
```python
spark.sql("ALTER TABLE my_catalog.demo.nyc_taxis ADD COLUMN tip_amount float")
```

## Step 5: Verify in Minio

Go back to the [Minio Console](http://localhost:9001). Browse the `warehouse` bucket. You will see:
- A `demo/` folder (namespace)
- A `nyc_taxis/` folder (table)
- `metadata/` and `data/` subfolders containing the actual Iceberg files.

## Step 6: Cleanup

To stop everything:

```bash
docker-compose down
```

To stop and remove volumes (resetting all data):

```bash
docker-compose down -v
```
