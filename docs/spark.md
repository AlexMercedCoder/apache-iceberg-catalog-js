# Apache Spark Integration Guide

Use the standard **Iceberg Spark Runtime** to connect to this REST catalog.

## Spark Shell Command

Launch a Spark Shell with the required packages and configuration:

```bash
spark-shell \
    --packages org.apache.iceberg:iceberg-spark-runtime-3.5_2.12:1.6.0,org.apache.hadoop:hadoop-aws:3.3.4 \
    --conf spark.sql.extensions=org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions \
    \
    --conf spark.sql.catalog.my_catalog=org.apache.iceberg.spark.SparkCatalog \
    --conf spark.sql.catalog.my_catalog.type=rest \
    --conf spark.sql.catalog.my_catalog.uri=http://localhost:3000 \
    --conf spark.sql.catalog.my_catalog.warehouse=s3://warehouse/ \
    --conf spark.sql.catalog.my_catalog.io-impl=org.apache.iceberg.aws.s3.S3FileIO \
    \
    --conf spark.hadoop.fs.s3a.endpoint=http://localhost:9000 \
    --conf spark.hadoop.fs.s3a.access.key=minioadmin \
    --conf spark.hadoop.fs.s3a.secret.key=minioadmin \
    --conf spark.hadoop.fs.s3a.path.style.access=true \
    --conf spark.hadoop.fs.s3a.impl=org.apache.hadoop.fs.s3a.S3AFileSystem
```

## SQL Examples

```sql
-- Create a table
CREATE TABLE my_catalog.default.sample (
    id BIGINT,
    data STRING
) USING iceberg;

-- Insert Data
INSERT INTO my_catalog.default.sample VALUES (1, 'Spark Works!');

-- Query Data
SELECT * FROM my_catalog.default.sample;

-- Time Travel
SELECT * FROM my_catalog.default.sample.history;
```
