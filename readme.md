# Apache Iceberg Catalog Prototype
##### Initial development by Alex Merced (github.com/alexmercedcoder)

This project is a JavaScript prototype for an Apache Iceberg catalog implemented using Node.js and Express. It provides a RESTful API for managing namespaces, tables, and views within an Iceberg catalog. The project includes Swagger documentation and a simple UI for adding namespaces.

## Getting Started

### Prerequisites

- Node.js (>= 14)
- Docker (optional, for containerized deployment)

### Installation

1. Clone the repository:
git clone <repository_url>
cd iceberg-catalog-server


2. Install dependencies:
npm install

### Running the Server

To start the server locally, run:
npm start

The server will be running at `http://localhost:3000`.

### Using Docker

To build and run the server using Docker, run:
docker-compose up --build

The server will be available at `http://localhost:3000`.

## API Documentation

Swagger documentation for the API is available at:
http://localhost:3000/api-docs


## UI for Managing Namespaces

A simple UI for listing and adding namespaces is available at:
http://localhost:3000/ui


## Endpoints

### Configuration API

- `GET /v1/config`
  - Lists all catalog configuration settings.

### OAuth2 API

- `POST /v1/oauth/tokens`
  - Gets a token using an OAuth2 flow.

### Catalog API

- `GET /v1/:prefix/namespaces`
  - Lists namespaces.

- `POST /v1/:prefix/namespaces`
  - Creates a namespace.

- `GET /v1/:prefix/namespaces/:namespace`
  - Loads the metadata properties for a namespace.

- `DELETE /v1/:prefix/namespaces/:namespace`
  - Drops a namespace from the catalog. The namespace must be empty.

- `POST /v1/:prefix/namespaces/:namespace/properties`
  - Sets or removes properties on a namespace.

- `GET /v1/:prefix/namespaces/:namespace/tables`
  - Lists all table identifiers under a given namespace.

- `POST /v1/:prefix/namespaces/:namespace/tables`
  - Creates a table in the given namespace.

- `POST /v1/:prefix/namespaces/:namespace/register`
  - Registers a table in the given namespace using a given metadata file location.

- `GET /v1/:prefix/namespaces/:namespace/tables/:table`
  - Loads a table from the catalog.

- `POST /v1/:prefix/namespaces/:namespace/tables/:table`
  - Commits updates to a table.

- `POST /v1/:prefix/namespaces/:namespace/tables/:table/metrics`
  - Sends a metrics report to the backend.

- `POST /v1/:prefix/namespaces/:namespace/tables/:table/notifications`
  - Sends a notification to the table.

- `POST /v1/:prefix/transactions/commit`
  - Commits updates to multiple tables in an atomic operation.

### View Operations

- `GET /v1/:prefix/namespaces/:namespace/views`
  - Lists all view identifiers under a given namespace.

- `POST /v1/:prefix/namespaces/:namespace/views`
  - Creates a view in the given namespace.

- `GET /v1/:prefix/namespaces/:namespace/views/:view`
  - Loads a view from the catalog.

- `POST /v1/:prefix/namespaces/:namespace/views/:view`
  - Replaces a view.

- `DELETE /v1/:prefix/namespaces/:namespace/views/:view`
  - Drops a view from the catalog.

- `POST /v1/:prefix/views/rename`
  - Renames a view from its current name to a new name.

## Logging

The project uses `winston` for logging. Log files are stored in the `logs` directory. Both console and file logging are enabled by default.
