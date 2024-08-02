const CatalogService = require('../services/catalogService');
const catalogService = new CatalogService();
const logger = require('../logger');

exports.getCatalogService = () => catalogService;

exports.getConfig = (req, res) => {
  try {
    const config = catalogService.getConfig();
    res.json(config);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.getToken = (req, res) => {
  try {
    const token = catalogService.getToken(req.body);
    res.json(token);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.listNamespaces = (req, res) => {
  try {
    const namespaces = catalogService.listNamespaces(req.query.parent);
    res.json(namespaces);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

exports.createNamespace = (req, res) => {
  try {
    const namespace = catalogService.createNamespace(req.body.namespace);
    res.json(namespace);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

exports.loadNamespaceMetadata = (req, res) => {
  try {
    const namespace = catalogService.loadNamespaceMetadata(req.params.namespace);
    res.json(namespace);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(404).json({ error: error.message });
  }
};

exports.dropNamespace = (req, res) => {
  try {
    catalogService.dropNamespace(req.params.namespace);
    res.sendStatus(204);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(404).json({ error: error.message });
  }
};

exports.updateProperties = (req, res) => {
  try {
    catalogService.updateProperties(req.params.namespace, req.body.updates, req.body.removals);
    res.sendStatus(200);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

exports.listTables = (req, res) => {
  try {
    const tables = catalogService.listTables(req.params.namespace);
    res.json(tables);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(404).json({ error: error.message });
  }
};

exports.createTable = (req, res) => {
  try {
    catalogService.createTable(req.params.namespace, req.body.table, req.body.metadata);
    res.sendStatus(200);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

exports.registerTable = (req, res) => {
  try {
    catalogService.registerTable(req.params.namespace, req.body.table, req.body.metadataLocation);
    res.sendStatus(200);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

exports.loadTable = (req, res) => {
  try {
    const table = catalogService.loadTable(req.params.namespace, req.params.table);
    res.json(table);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(404).json({ error: error.message });
  }
};

exports.updateTable = (req, res) => {
  try {
    catalogService.updateTable(req.params.namespace, req.params.table, req.body.updates);
    res.sendStatus(200);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

exports.dropTable = (req, res) => {
  try {
    catalogService.dropTable(req.params.namespace, req.params.table);
    res.sendStatus(204);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(404).json({ error: error.message });
  }
};

exports.reportMetrics = (req, res) => {
  try {
    catalogService.reportMetrics(req.params.namespace, req.params.table, req.body.metrics);
    res.sendStatus(204);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(404).json({ error: error.message });
  }
};

exports.sendNotification = (req, res) => {
  try {
    catalogService.sendNotification(req.params.namespace, req.params.table, req.body.notification);
    res.sendStatus(204);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(404).json({ error: error.message });
  }
};

exports.commitTransaction = (req, res) => {
  try {
    catalogService.commitTransaction(req.body.transactions);
    res.sendStatus(204);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

exports.listViews = (req, res) => {
  try {
    const views = catalogService.listViews(req.params.namespace);
    res.json(views);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(404).json({ error: error.message });
  }
};

exports.createView = (req, res) => {
  try {
    catalogService.createView(req.params.namespace, req.body.view, req.body.metadata);
    res.sendStatus(200);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

exports.loadView = (req, res) => {
  try {
    const view = catalogService.loadView(req.params.namespace, req.params.view);
    res.json(view);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(404).json({ error: error.message });
  }
};

exports.replaceView = (req, res) => {
  try {
    catalogService.replaceView(req.params.namespace, req.params.view, req.body.metadata);
    res.sendStatus(200);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};

exports.dropView = (req, res) => {
  try {
    catalogService.dropView(req.params.namespace, req.params.view);
    res.sendStatus(204);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(404).json({ error: error.message });
  }
};

exports.renameView = (req, res) => {
  try {
    catalogService.renameView(req.params.namespace, req.body.oldName, req.body.newName);
    res.sendStatus(204);
  } catch (error) {
    logger.error(`Error getting config: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
};
