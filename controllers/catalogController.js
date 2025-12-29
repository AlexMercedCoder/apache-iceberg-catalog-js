const CatalogService = require('../services/catalogService');
const catalogService = new CatalogService();
const logger = require('../logger');

exports.getCatalogService = () => catalogService;

const handleError = (res, error, context) => {
    logger.error(`Error ${context}: ${error.message}`);
    if (error.message.includes('exists')) {
        res.status(409).json({ error: { message: error.message, type: "AlreadyExistsException", code: 409 } });
    } else if (error.code === 409 || error.message.includes('Requirement failed')) {
        res.status(409).json({ error: { message: error.message, type: "CommitFailedException", code: 409 } });
    } else if (error.message.includes('not found') || error.message.includes('NoSuch')) {
        res.status(404).json({ error: { message: error.message, type: "NotFoundException", code: 404 } });
    } else {
        res.status(400).json({ error: { message: error.message, type: "BadRequestException", code: 400 } });
    }
};

/* --- Config & Auth --- */
exports.getConfig = async (req, res) => {
  try {
    const config = await catalogService.getConfig();
    res.json(config);
  } catch (error) { handleError(res, error, 'getting config'); }
};

exports.getToken = async (req, res) => {
  try {
    const token = await catalogService.getToken(req.body);
    res.json(token);
  } catch (error) { handleError(res, error, 'getting token'); }
};

/* --- Namespace --- */
exports.listNamespaces = async (req, res) => {
  try {
    const { namespaces, nextPageToken } = await catalogService.listNamespaces(req.query.parent, req.query.pageToken, req.query.pageSize);
    res.json({ namespaces, "next-page-token": nextPageToken });
  } catch (error) { handleError(res, error, 'listing namespaces'); }
};

exports.createNamespace = async (req, res) => {
  try {
    const result = await catalogService.createNamespace(req.body.namespace);
    res.json(result);
  } catch (error) { handleError(res, error, 'creating namespace'); }
};

exports.loadNamespaceMetadata = async (req, res) => {
  try {
    const namespace = await catalogService.loadNamespaceMetadata(req.params.namespace);
    res.json(namespace);
  } catch (error) { handleError(res, error, 'loading namespace'); }
};

exports.namespaceExists = async (req, res) => {
  try {
    const exists = await catalogService.checkNamespaceExists(req.params.namespace);
    if (exists) res.sendStatus(204);
    else res.sendStatus(404);
  } catch (error) { handleError(res, error, 'checking namespace exists'); }
};

exports.dropNamespace = async (req, res) => {
  try {
    await catalogService.dropNamespace(req.params.namespace);
    res.sendStatus(204);
  } catch (error) { handleError(res, error, 'dropping namespace'); }
};

exports.updateProperties = async (req, res) => {
  try {
    const result = await catalogService.updateProperties(req.params.namespace, req.body.updates, req.body.removals);
    res.json(result);
  } catch (error) { handleError(res, error, 'updating namespace properties'); }
};

/* --- Table --- */
exports.listTables = async (req, res) => {
  try {
    const { identifiers, nextPageToken } = await catalogService.listTables(req.params.namespace, req.query.pageToken, req.query.pageSize);
    res.json({ identifiers, "next-page-token": nextPageToken });
  } catch (error) { handleError(res, error, 'listing tables'); }
};

exports.createTable = async (req, res) => {
  try {
    const tableName = req.body.name; 
    await catalogService.createTable(req.params.namespace, tableName, req.body);
    const loaded = await catalogService.loadTable(req.params.namespace, tableName);
    res.json(loaded);
  } catch (error) { handleError(res, error, 'creating table'); }
};

exports.registerTable = async (req, res) => {
  try {
    const tableName = req.body.name;
    const metaLoc = req.body['metadata-location'];
    await catalogService.registerTable(req.params.namespace, tableName, metaLoc);
    const loaded = await catalogService.loadTable(req.params.namespace, tableName);
    res.json(loaded);
  } catch (error) { handleError(res, error, 'registering table'); }
};

exports.loadTable = async (req, res) => {
  try {
    const table = await catalogService.loadTable(req.params.namespace, req.params.table);
    res.json(table);
  } catch (error) { handleError(res, error, 'loading table'); }
};

exports.tableExists = async (req, res) => {
  try {
    const exists = await catalogService.checkTableExists(req.params.namespace, req.params.table);
    if (exists) res.sendStatus(204);
    else res.sendStatus(404);
  } catch (error) { handleError(res, error, 'checking table exists'); }
};

exports.updateTable = async (req, res) => {
  try {
    const result = await catalogService.updateTable(req.params.namespace, req.params.table, req.body.updates || [], req.body.requirements || []);
    res.json(result);
  } catch (error) { handleError(res, error, 'updating table'); }
};

exports.dropTable = async (req, res) => {
  try {
    await catalogService.dropTable(req.params.namespace, req.params.table);
    res.sendStatus(204);
  } catch (error) { handleError(res, error, 'dropping table'); }
};

exports.renameTable = async (req, res) => {
    try {
        // req.body: { source: Identifier, destination: Identifier }
        await catalogService.renameTable(req.body.source, req.body.destination);
        res.sendStatus(204);
    } catch (error) { handleError(res, error, 'renaming table'); }
};

/* --- Misc --- */
exports.reportMetrics = async (req, res) => { res.sendStatus(204); }
exports.sendNotification = async (req, res) => { res.sendStatus(204); }
exports.commitTransaction = async (req, res) => { 
    try {
        // Spec: Request body is { "table-changes": [ { identifier, requirements, updates } ] }
        await catalogService.commitTransaction(req.body['table-changes']);
        res.sendStatus(204);
    } catch (error) { handleError(res, error, 'committing transaction'); }
};

/* --- View --- */
exports.listViews = async (req, res) => {
  try {
    const { identifiers, nextPageToken } = await catalogService.listViews(req.params.namespace, req.query.pageToken, req.query.pageSize);
    res.json({ identifiers, "next-page-token": nextPageToken });
  } catch (error) { handleError(res, error, 'listing views'); }
};

exports.createView = async (req, res) => {
  try {
    const viewName = req.body.name; 
    await catalogService.createView(req.params.namespace, viewName, req.body);
    const loaded = await catalogService.loadView(req.params.namespace, viewName);
    res.json(loaded);
  } catch (error) { handleError(res, error, 'creating view'); }
};

exports.loadView = async (req, res) => {
  try {
    const view = await catalogService.loadView(req.params.namespace, req.params.view);
    res.json(view);
  } catch (error) { handleError(res, error, 'loading view'); }
};

exports.viewExists = async (req, res) => {
  try {
    const exists = await catalogService.checkViewExists(req.params.namespace, req.params.view);
    if (exists) res.sendStatus(204);
    else res.sendStatus(404);
  } catch (error) { handleError(res, error, 'checking view exists'); }
};

exports.replaceView = async (req, res) => {
  try {
    const viewName = req.params.view;
    const result = await catalogService.replaceView(req.params.namespace, viewName, req.body);
    res.json(result);
  } catch (error) { handleError(res, error, 'replacing view'); }
};

exports.dropView = async (req, res) => {
  try {
    await catalogService.dropView(req.params.namespace, req.params.view);
    res.sendStatus(204);
  } catch (error) { handleError(res, error, 'dropping view'); }
};

exports.renameView = async (req, res) => {
  try {
     // req.body: { source: Identifier, destination: Identifier }
    await catalogService.renameView(req.body.source.namespace, req.body.source.name, req.body.destination.name);
    res.sendStatus(204);
  } catch (error) { handleError(res, error, 'renaming view'); }
};
