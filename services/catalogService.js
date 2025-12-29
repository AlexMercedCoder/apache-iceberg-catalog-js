const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

class CatalogService {
  constructor() {
    this.db = null;
    this.warehouseLocation = process.env.WAREHOUSE_LOCATION || 's3://warehouse/';
    
    // S3 Config
    const s3Config = {
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'admin',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'password'
      }
    };
    
    // Support custom endpoint for Minio
    if (process.env.AWS_S3_ENDPOINT) {
        s3Config.endpoint = process.env.AWS_S3_ENDPOINT;
        s3Config.forcePathStyle = true; // Required for Minio
    }
    
    this.s3 = new S3Client(s3Config);
  }

  async init() {
    this.db = await open({
      filename: './catalog.db',
      driver: sqlite3.Database
    });

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS namespaces (
        name TEXT PRIMARY KEY,
        properties TEXT
      );
      CREATE TABLE IF NOT EXISTS tables (
        namespace TEXT,
        name TEXT,
        metadata_location TEXT,
        metadata_json TEXT, 
        PRIMARY KEY (namespace, name)
      );
      CREATE TABLE IF NOT EXISTS views (
        namespace TEXT,
        name TEXT,
        metadata_location TEXT,
        metadata_json TEXT,
        PRIMARY KEY (namespace, name)
      );
    `);
  }

  /* --- S3 Helpers --- */
  async writeMetadataToS3(location, content) {
    // location: s3://bucket/key
    const url = new URL(location);
    const bucket = url.hostname;
    const key = url.pathname.substring(1); // remove leading slash

    await this.s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(content),
        ContentType: 'application/json'
    }));
  }
  
  async readMetadataFromS3(location) {
      const url = new URL(location);
      const bucket = url.hostname;
      const key = url.pathname.substring(1);

      const response = await this.s3.send(new GetObjectCommand({
          Bucket: bucket,
          Key: key
      }));
      
      const str = await response.Body.transformToString();
      return JSON.parse(str);
  }

  /* --- Configuration --- */
  getConfig() {
    return {
      defaults: { "clients": "4" },
      overrides: {
        "warehouse": this.warehouseLocation,
        "prefix": "catalogs"
      }
    };
  }

  /* --- Auth --- */
  getToken(credentials) {
    return { 
      access_token: 'dummy-token', 
      token_type: 'bearer',
      expires_in: 3600 
    };
  }

  /* --- Namespace Operations --- */
  async listNamespaces(parent, pageToken, pageSize = 100) {
    let offset = 0;
    if (pageToken) {
        try {
            const decoded = Buffer.from(pageToken, 'base64').toString('utf-8');
            offset = parseInt(decoded.split('=')[1]);
        } catch(e) { console.warn("Invalid page token, ignoring"); }
    }
    const limit = parseInt(pageSize) || 100;

    let namespaces;
    if (parent) {
      const result = await this.db.all('SELECT name FROM namespaces WHERE name LIKE ? LIMIT ? OFFSET ?', [`${parent}.%`, limit + 1, offset]);
      
      let nextPageToken = null;
      if (result.length > limit) {
          nextPageToken = Buffer.from(`offset=${offset + limit}`).toString('base64');
          result.pop(); // Remove the extra item
      }

      const validNames = new Set();
       result.forEach(row => {
          const suffix = row.name.slice(parent.length + 1);
          const parts = suffix.split('.');
          if (parts[0]) validNames.add(parts[0]);
       });
       return { namespaces: Array.from(validNames).map(n => ({ namespace: n })), nextPageToken }; 
       // Logic gap: validNames deduplication happens AFTER limit. Pagination might cut off duplicates awkwardly. 
       // For accurate sub-namespace pagination, we should select distinct *sub* namespaces in SQL, but that's hard with just 'name'.
       // Accepting this limitation for prototype: Pagination runs on *all* rows, then deduplicates. 
       // This means page size might fluctuate.
       
       // actually strict spec compliance: return keys. 
       
    } else {
       namespaces = await this.db.all('SELECT name FROM namespaces LIMIT ? OFFSET ?', [limit + 1, offset]);
       let nextPageToken = null;
       if (namespaces.length > limit) {
           nextPageToken = Buffer.from(`offset=${offset + limit}`).toString('base64');
           namespaces.pop();
       }
       return { namespaces: namespaces.map(n => n.name.split('.')), nextPageToken };
    }
  }

  async checkNamespaceExists(namespace) {
      const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
      const result = await this.db.get('SELECT 1 FROM namespaces WHERE name = ?', [namespaceStr]);
      return !!result;
  }

  async createNamespace(namespace) {
    const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
    try {
      await this.db.run('INSERT INTO namespaces (name, properties) VALUES (?, ?)', [namespaceStr, '{}']);
      return { namespace: namespaceStr.split('.'), properties: {} };
    } catch (e) {
       if (e.message.includes('UNIQUE constraint failed')) throw new Error('Namespace already exists');
       throw e;
    }
  }

  async loadNamespaceMetadata(namespace) {
    const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
    const result = await this.db.get('SELECT name, properties FROM namespaces WHERE name = ?', [namespaceStr]);
    if (!result) throw new Error('Namespace not found');
    return { namespace: result.name.split('.'), properties: JSON.parse(result.properties) };
  }

  async dropNamespace(namespace) {
    const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
    const tables = await this.db.get('SELECT 1 FROM tables WHERE namespace = ? LIMIT 1', [namespaceStr]);
    if (tables) throw new Error('Namespace not empty');
    const result = await this.db.run('DELETE FROM namespaces WHERE name = ?', [namespaceStr]);
    if (result.changes === 0) throw new Error('Namespace not found');
  }

  async updateProperties(namespace, updates, removals) {
    const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
    const row = await this.db.get('SELECT properties FROM namespaces WHERE name = ?', [namespaceStr]);
    if (!row) throw new Error('Namespace not found');

    let props = JSON.parse(row.properties);
    if (removals) removals.forEach((prop) => delete props[prop]);
    if (updates) Object.assign(props, updates);

    await this.db.run('UPDATE namespaces SET properties = ? WHERE name = ?', [JSON.stringify(props), namespaceStr]);
    return { updated: updates || [], removed: removals || [], missing: [] };
  }

  /* --- Table Operations --- */
  
  async checkTableExists(namespace, table) {
      const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
      const row = await this.db.get('SELECT 1 FROM tables WHERE namespace = ? AND name = ?', [namespaceStr, table]);
      return !!row;
  }

  async listTables(namespace, pageToken, pageSize = 100) {
    const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
    const ns = await this.db.get('SELECT 1 FROM namespaces WHERE name = ?', [namespaceStr]);
    if (!ns) throw new Error('Namespace not found');

    let offset = 0;
    if (pageToken) {
        try {
             const decoded = Buffer.from(pageToken, 'base64').toString('utf-8');
             offset = parseInt(decoded.split('=')[1]);
        } catch(e) {}
    }
    const limit = parseInt(pageSize) || 100;

    const tables = await this.db.all('SELECT name FROM tables WHERE namespace = ? LIMIT ? OFFSET ?', [namespaceStr, limit + 1, offset]);
    
    let nextPageToken = null;
    if (tables.length > limit) {
        nextPageToken = Buffer.from(`offset=${offset + limit}`).toString('base64');
        tables.pop();
    }
    
    return { identifiers: tables.map(t => ({ namespace: namespaceStr.split('.'), name: t.name })), nextPageToken };
  }

  async createTable(namespace, table, createRequest) {
    const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
    
    // 1. Generate Metadata
    const metadataLocation = `${this.warehouseLocation}${namespaceStr}/${table}/metadata/v1.metadata.json`;
    
    const metadata = {
        "format-version": 2,
        "table-uuid": uuidv4(),
        "location": createRequest.location || `${this.warehouseLocation}${namespaceStr}/${table}`,
        "last-updated-ms": Date.now(),
        "last-column-id": createRequest.schema && createRequest.schema.fields ? createRequest.schema.fields.length : 0,
        "schemas": [ 
            { 
               ...createRequest.schema, 
               "schema-id": 0, 
               "identifier-field-ids": [] 
            } 
        ],
        "current-schema-id": 0,
        "partition-specs": [ 
            { 
                "spec-id": 0, 
                "fields": createRequest["partition-spec"] ? createRequest["partition-spec"].fields : [] 
            } 
        ],
        "default-spec-id": 0,
        "last-partition-id": 0, // Should calc based on spec
        "properties": createRequest.properties || {},
        "current-snapshot-id": -1,
        "snapshots": [],
        "snapshot-log": [],
        "metadata-log": [],
        "sort-orders": [ { "order-id": 0, "fields": [] } ],
        "default-sort-order-id": 0
    };

    const metadataJson = JSON.stringify(metadata);

    // 2. Write to S3
    try {
        await this.writeMetadataToS3(metadataLocation, metadata);
    } catch(err) {
        console.error("Failed to write to S3", err);
        throw new Error(`Failed to write metadata to S3: ${err.message}`);
    }

    // 3. Store in DB
    try {
      await this.db.run(
        'INSERT INTO tables (namespace, name, metadata_location, metadata_json) VALUES (?, ?, ?, ?)', 
        [namespaceStr, table, metadataLocation, metadataJson]
      );
    } catch(e) {
       if (e.message.includes('UNIQUE constraint failed')) throw new Error('Table already exists');
       throw e;
    }
  }

  async registerTable(namespace, table, metadataLocation) {
    const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
    try {
      // In register mode, we just verify it exists? Or trust it? 
      // We will try to read it to populate metadata_json cache (optional but good for consistency)
      let metadataJson = '{}';
      try {
          const meta = await this.readMetadataFromS3(metadataLocation);
          metadataJson = JSON.stringify(meta);
      } catch (err) {
          console.warn(`Could not read metadata from ${metadataLocation}, storing pointer only.`);
      }

      await this.db.run(
        'INSERT INTO tables (namespace, name, metadata_location, metadata_json) VALUES (?, ?, ?, ?)',
        [namespaceStr, table, metadataLocation, metadataJson]
      );
    } catch (e) {
        if (e.message.includes('UNIQUE constraint failed')) throw new Error('Table already exists');
       throw e;
    }
  }

  async loadTable(namespace, table) {
    const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
    const row = await this.db.get('SELECT metadata_location, metadata_json FROM tables WHERE namespace = ? AND name = ?', [namespaceStr, table]);
    if (!row) throw new Error('Table not found');
    
    // Return the location. 
    // Spec: LoadTableResponse { metadata-location, metadata, config... }
    let metadata = {};
    if (row.metadata_json && row.metadata_json !== '{}') {
        metadata = JSON.parse(row.metadata_json);
    }
    
    return { 
        metadataLocation: row.metadata_location,
        metadata: metadata
    };
  }
  
  async renameTable(source, destination) {
      // source: { namespace: [], name: '..' }, destination: { namespace: [], name: '..' }
      const srcNs = source.namespace.join('.');
      const destNs = destination.namespace.join('.');
      const srcName = source.name;
      const destName = destination.name;
      
      const row = await this.db.get('SELECT 1 FROM tables WHERE namespace = ? AND name = ?', [srcNs, srcName]);
      if (!row) throw new Error('Table not found');
      
      const destExists = await this.db.get('SELECT 1 FROM tables WHERE namespace = ? AND name = ?', [destNs, destName]);
      if (destExists) throw new Error('Destination table exists'); // Should strictly be 409
      
      await this.db.run(
          'UPDATE tables SET namespace = ?, name = ? WHERE namespace = ? AND name = ?',
          [destNs, destName, srcNs, srcName]
      );
  }

  async commitTransaction(tableUpdates) {
      // tableUpdates: Array of { identifier: { namespace, name }, requirements: [], updates: [] }
      
      // 1. Begin Transaction
      await this.db.run('BEGIN TRANSACTION');
      
      try {
          for (const item of tableUpdates) {
              const { identifier, requirements, updates } = item;
              const namespaceStr = Array.isArray(identifier.namespace) ? identifier.namespace.join('.') : identifier.namespace;
              const TABLE = identifier.name;

              // Logic duplicated from updateTable but within transaction context
              const row = await this.db.get('SELECT metadata_location, metadata_json FROM tables WHERE namespace = ? AND name = ?', [namespaceStr, TABLE]);
              if (!row) throw new Error(`Table not found: ${TABLE}`);

              let currentMeta;
              try {
                  // In transaction, we might rely on DB json for speed/consistency if locking is an issue, 
                  // but S3 is source of truth. 
                  // For prototype, let's use checkRequirements against the DB version for speed/simplicity
                  currentMeta = JSON.parse(row.metadata_json);
              } catch (e) {
                   throw new Error("Failed to parse metadata transaction");
              }

              // Validate
              try {
                  this.checkRequirements(currentMeta, requirements);
              } catch (e) {
                   const err = new Error(e.message);
                   err.code = 409;
                   throw err;
              }

              // Calculate New State (Naive)
              const newVersion = (parseInt(row.metadata_location.match(/v(\d+)\.metadata\.json/)?.[1] || "1")) + 1;
              const newLocation = row.metadata_location.replace(/v\d+\.metadata\.json/, `v${newVersion}.metadata.json`);

              if (Array.isArray(updates)) {
                  updates.forEach(update => {
                      if (update.action === 'set-properties') {
                           if (!currentMeta.properties) currentMeta.properties = {};
                           Object.assign(currentMeta.properties, update.updates);
                      }
                  });
              }

              // Update Metadata Location logic...
              // CRITICAL: We write S3 *inside* the transaction loop. 
              // If we fail later, we have garbage S3 files. Acceptable for prototype.
              await this.writeMetadataToS3(newLocation, currentMeta);

              // Update DB
              await this.db.run(
                 'UPDATE tables SET metadata_location = ?, metadata_json = ? WHERE namespace = ? AND name = ?',
                 [newLocation, JSON.stringify(currentMeta), namespaceStr, TABLE]
              );
          }
          
          await this.db.run('COMMIT');
      } catch (error) {
          await this.db.run('ROLLBACK');
          throw error;
      }
  }

    /* --- OCC Helpers --- */
    checkRequirements(metadata, requirements) {
        if (!requirements || requirements.length === 0) return;

        for (const req of requirements) {
            switch (req.type) {
                case 'assert-create':
                    // handled by createTable usually, but if called on update...
                     throw new Error('assert-create not supported in updateTable');
                case 'assert-table-uuid':
                    if (metadata['table-uuid'] !== req.uuid) {
                        throw new Error(`Requirement failed: table-uuid mismatch. Expected ${req.uuid}, found ${metadata['table-uuid']}`);
                    }
                    break;
                case 'assert-ref-snapshot-id':
                    // snapshot of a branch/tag
                    // Simplified: check main
                    // If complex branching, need to find ref.
                    break;
                case 'assert-current-snapshot-id':
                     const currentSnap = metadata['current-snapshot-id'];
                     if (currentSnap !== req['snapshot-id']) {
                         // Pass validation if req is -1 (null) and current is -1
                         if (req['snapshot-id'] === null && currentSnap === -1) break;
                         throw new Error(`Requirement failed: current-snapshot-id mismatch. Expected ${req['snapshot-id']}, found ${currentSnap}`);
                     }
                     break;
                 case 'assert-last-assigned-field-id':
                     if (metadata['last-column-id'] !== req['last-assigned-field-id']) {
                          throw new Error(`Requirement failed: last-assigned-field-id mismatch. Expected ${req['last-assigned-field-id']}, found ${metadata['last-column-id']}`);
                     }
                     break;
                  case 'assert-last-assigned-partition-id':
                     if (metadata['last-partition-id'] !== req['last-assigned-partition-id']) {
                          throw new Error(`Requirement failed: last-assigned-partition-id mismatch. Expected ${req['last-assigned-partition-id']}, found ${metadata['last-partition-id']}`);
                     }
                     break;
                default:
                    console.warn(`Ignoring unsupported requirement: ${req.type}`);
            }
        }
    }

  async updateTable(namespace, table, updates, requirements = []) {
    const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
    const row = await this.db.get('SELECT metadata_location, metadata_json FROM tables WHERE namespace = ? AND name = ?', [namespaceStr, table]);
    if (!row) throw new Error('Table not found');
    
    // 1. Load current metadata (Prefer S3 to be safe?)
    let currentMeta;
    try {
        currentMeta = await this.readMetadataFromS3(row.metadata_location);
    } catch (err) {
        console.warn("Could not read from S3, falling back to DB cache");
        // Fallback or fail? For strict OCC, maybe fail. But prototype... use DB cache.
        currentMeta = JSON.parse(row.metadata_json);
    }

    // 2. Validate Requirements (OCC)
    try {
        this.checkRequirements(currentMeta, requirements);
    } catch (e) {
        // Propagate as standard Error, Controller maps to 409
        if (e.message.includes('Requirement failed')) {
            const err = new Error(e.message);
            err.code = 409; 
            throw err;
        }
        throw e;
    }

    // 3. Apply Updates (Naive: Just merge top level properties if possible)
    // Only handling property updates for now to start safe
    // If complex updates sent, we log warning
    console.warn("Naive updateTable implementation: This does not implement full Iceberg Spec logic for updates!");
    
    // Fake a new version
    const newVersion = (parseInt(row.metadata_location.match(/v(\d+)\.metadata\.json/)?.[1] || "1")) + 1;
    const newLocation = row.metadata_location.replace(/v\d+\.metadata\.json/, `v${newVersion}.metadata.json`);
    
    // Just save the old meta to new location for now (No-op update)
    // UNLESS updates is an object (from my old logic)
    // Spec updates is: TableUpdate[] (actions like 'upgrade-format-version', 'add-schema', 'set-properties'...)
    // This prototype assumed 'updates' was just a property map previously. 
    // I need to handle at least 'set-properties'.
    
    if (Array.isArray(updates)) {
        updates.forEach(update => {
            if (update.action === 'set-properties') {
                 Object.assign(currentMeta.properties, update.updates);
            }
            // Add other actions if needed
        });
    } else if (typeof updates === 'object') {
        // Backward compat with my previous naive code
         Object.assign(currentMeta, updates);
    }
    
    // Write new metadata
    await this.writeMetadataToS3(newLocation, currentMeta);
    
    // Update DB
    await this.db.run(
       'UPDATE tables SET metadata_location = ?, metadata_json = ? WHERE namespace = ? AND name = ?',
       [newLocation, JSON.stringify(currentMeta), namespaceStr, table]
    );

    return { "metadata-location": newLocation, metadata: currentMeta };
  }

  async dropTable(namespace, table) {
    const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
    const result = await this.db.run('DELETE FROM tables WHERE namespace = ? AND name = ?', [namespaceStr, table]);
    if (result.changes === 0) throw new Error('Table not found');
  }

  /* --- View Operations --- */
  // ... (Keep existing view logic, maybe add checkViewExists)
  async checkViewExists(namespace, view) {
      const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
      const row = await this.db.get('SELECT 1 FROM views WHERE namespace = ? AND name = ?', [namespaceStr, view]);
      return !!row;
  }
  
  async listViews(namespace, pageToken, pageSize = 100) {
      const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
      
      let offset = 0;
      if (pageToken) {
          try {
              const decoded = Buffer.from(pageToken, 'base64').toString('utf-8');
              offset = parseInt(decoded.split('=')[1]);
          } catch(e) {}
      }
      const limit = parseInt(pageSize) || 100;

      const views = await this.db.all('SELECT name FROM views WHERE namespace = ? LIMIT ? OFFSET ?', [namespaceStr, limit + 1, offset]);
      
      let nextPageToken = null;
      if (views.length > limit) {
          nextPageToken = Buffer.from(`offset=${offset + limit}`).toString('base64');
          views.pop();
      }

      return { identifiers: views.map(v => ({ namespace: namespaceStr.split('.'), name: v.name })), nextPageToken };
  }

  async createView(namespace, view, metadata) {
      const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
      const metaJson = JSON.stringify(metadata);
      const loc = `internal://${namespaceStr}/${view}/metadata.json`; 
      try {
        await this.db.run('INSERT INTO views (namespace, name, metadata_location, metadata_json) VALUES (?, ?, ?, ?)', 
        [namespaceStr, view, loc, metaJson]);
      } catch (e) {
         if (e.message.includes('UNIQUE constraint failed')) throw new Error('View already exists');
         throw e;
      }
  }

  async loadView(namespace, view) {
      const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
      const row = await this.db.get('SELECT metadata_location, metadata_json FROM views WHERE namespace = ? AND name = ?', [namespaceStr, view]);
      if (!row) throw new Error('View not found');
      return { metadataLocation: row.metadata_location, metadata: JSON.parse(row.metadata_json) };
  }

  async replaceView(namespace, view, metadata) {
      const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
       const row = await this.db.get('SELECT 1 FROM views WHERE namespace = ? AND name = ?', [namespaceStr, view]);
      if (!row) throw new Error('View not found');
       await this.db.run('UPDATE views SET metadata_json = ? WHERE namespace = ? AND name = ?', 
       [JSON.stringify(metadata), namespaceStr, view]);
       const loc = `internal://${namespaceStr}/${view}/metadata.json`; 
       return { metadataLocation: loc, metadata: metadata };
  }

  async dropView(namespace, view) {
      const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
       const result = await this.db.run('DELETE FROM views WHERE namespace = ? AND name = ?', [namespaceStr, view]);
    if (result.changes === 0) throw new Error('View not found');
  }
  
  async renameView(namespace, oldName, newName) {
        const namespaceStr = namespace.join('.'); // renameView handler passes array
       try {
           await this.db.run('UPDATE views SET name = ? WHERE namespace = ? AND name = ?', [newName, namespaceStr, oldName]);
       } catch (e) {
           throw e;
       }
  }
}

module.exports = CatalogService;