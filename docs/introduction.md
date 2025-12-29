# Introduction to JS Iceberg Catalog

The **JS Iceberg Catalog** is a lightweight, portable implementation of the **Apache Iceberg REST Catalog Specification**, built with **Node.js**.

## Purpose

The primary goal of this project is to provide a simple, easy-to-deploy catalog server for:
- **Local Development**: Quickly spin up an Iceberg catalog on your laptop without the overhead of heavy Java-based services (like Nessie or Gravitino).
- **CI/CD Testing**: Lightweight container for integration tests of Iceberg clients (PyIceberg, Spark, Flink).
- **Learning & Prototyping**: Understand how the Iceberg REST protocol works under the hood.

## Core Concepts

### Architecture
- **Catalog Server**: A Node.js Express server that handles REST API requests.
- **Metadata Store**: Uses **SQLite** (embedded) to track namespaces and table pointers (`metadata_location`).
- **File Store**: Integrates with **S3-compatible Object Storage** (AWS S3, Minio, GCS, Azure Blob via gateways) to store Iceberg metadata files (`vX.metadata.json`), manifest lists, manifests, and data files.

### Compliance
This catalog implements the **Iceberg REST OpenAPI Specification**. This means standard Iceberg clients can connect to it securely and perform standard operations:
- **Namespaces**: Create, list, drop.
- **Tables**: Create, load, update (schema evolution, partition evolution), drop, rename.
- **Transactions**: Atomic updates compliant with Optimistic Concurrency Control (OCC).

## Why Node.js?
While most Iceberg ecosystem tools are JVM-based, a Node.js implementation offers:
- **Speed**: Instant startup time.
- **Simplicity**: Single docker image, minimal dependencies.
- **Access**: easier for web developers and full-stack engineers to inspect and modify.
