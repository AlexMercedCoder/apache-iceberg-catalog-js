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
  async listNamespaces(parent) {
    let namespaces;
    if (parent) {
      const result = await this.db.all('SELECT name FROM namespaces WHERE name LIKE ?', [`${parent}.%`]);
      const validNames = new Set();
       result.forEach(row => {
          const suffix = row.name.slice(parent.length + 1);
          const parts = suffix.split('.');
          if (parts[0]) validNames.add(parts[0]);
       });
       return Array.from(validNames).map(n => ({ namespace: n })); // return Identifier components? Spec says ListNamespacesResponse { namespaces: [Namespace] } where Namespace is string[]
       // Fix: Spec says ListNamespacesResponse -> namespaces: Namespace[] -> string[]
       // My previous implementation returned result.map(n => n.name.split('.')) which was correct: full namespaces?
       // ListNamespaces returns "identifiers of namespaces". Identifier = string[].
       // Wait. If I have 'a.b' and request list(a), I want ['a', 'b'].
       // Logic: return fully qualified or parts? Spec: "namespaces: [ [ 'accounting', 'tax' ] ]"
       // So I should return the FULL namespace parts.
       
       return result.map(n => n.name.split('.'));
    } else {
       namespaces = await this.db.all('SELECT name FROM namespaces');
       return namespaces.map(n => n.name.split('.'));
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
    removals.forEach((prop) => delete props[prop]);
    Object.assign(props, updates);

    await this.db.run('UPDATE namespaces SET properties = ? WHERE name = ?', [JSON.stringify(props), namespaceStr]);
    return { updated: updates, removed: removals, missing: [] };
  }

  /* --- Table Operations --- */
  
  async checkTableExists(namespace, table) {
      const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
      const row = await this.db.get('SELECT 1 FROM tables WHERE namespace = ? AND name = ?', [namespaceStr, table]);
      return !!row;
  }

  async listTables(namespace) {
    const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
    const ns = await this.db.get('SELECT 1 FROM namespaces WHERE name = ?', [namespaceStr]);
    if (!ns) throw new Error('Namespace not found');

    const tables = await this.db.all('SELECT name FROM tables WHERE namespace = ?', [namespaceStr]);
    return tables.map(t => ({ namespace: namespaceStr.split('.'), name: t.name }));
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
        "metadata-log": []
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

  async updateTable(namespace, table, updates) {
    const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
    const row = await this.db.get('SELECT metadata_location, metadata_json FROM tables WHERE namespace = ? AND name = ?', [namespaceStr, table]);
    if (!row) throw new Error('Table not found');
    
    // 1. Load current metadata (Prefer S3 to be safe?)
    let currentMeta;
    try {
        currentMeta = await this.readMetadataFromS3(row.metadata_location);
    } catch (err) {
        console.warn("Could not read from S3, falling back to DB cache");
        currentMeta = JSON.parse(row.metadata_json);
    }

    // 2. Apply Updates (Naive: Just merge top level properties if possible)
    // Only handling property updates for now to start safe
    // If complex updates sent, we log warning
    console.warn("Naive updateTable implementation: This does not implement full Iceberg Spec!");
    
    // Fake a new version
    const newVersion = (parseInt(row.metadata_location.match(/v(\d+)\.metadata\.json/)?.[1] || "1")) + 1;
    const newLocation = row.metadata_location.replace(/v\d+\.metadata\.json/, `v${newVersion}.metadata.json`);
    
    // Just save the old meta to new location for now (No-op update)
    // UNLESS updates is an object (from my old logic)
    if (!Array.isArray(updates)) {
        Object.assign(currentMeta, updates);
    }
    
    // Write new metadata
    await this.writeMetadataToS3(newLocation, currentMeta);
    
    // Update DB
    await this.db.run(
       'UPDATE tables SET metadata_location = ?, metadata_json = ? WHERE namespace = ? AND name = ?',
       [newLocation, JSON.stringify(currentMeta), namespaceStr, table]
    );

    return { metadataLocation: newLocation, metadata: currentMeta };
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
  
  async listViews(namespace) {
      const namespaceStr = Array.isArray(namespace) ? namespace.join('.') : namespace;
      const views = await this.db.all('SELECT name FROM views WHERE namespace = ?', [namespaceStr]);
      return views.map(v => ({ namespace: namespaceStr.split('.'), name: v.name }));
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