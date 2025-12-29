const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');

/**
 * @swagger
 * /v1/config:
 *   get:
 *     tags: [Configuration API]
 *     summary: List all catalog configuration settings
 *     operationId: getConfig
 */
router.get('/config', catalogController.getConfig); // Valid

router.post('/oauth/tokens', catalogController.getToken); // Valid

/* --- Namespaces --- */
router.head('/:prefix/namespaces/:namespace', catalogController.namespaceExists); // Exists [NEW]
router.get('/:prefix/namespaces/:namespace', catalogController.loadNamespaceMetadata); // Load
router.get('/:prefix/namespaces', catalogController.listNamespaces); // List
router.post('/:prefix/namespaces', catalogController.createNamespace); // Create
router.delete('/:prefix/namespaces/:namespace', catalogController.dropNamespace); // Drop
router.post('/:prefix/namespaces/:namespace/properties', catalogController.updateProperties); // Update Props

/* --- Tables --- */
router.head('/:prefix/namespaces/:namespace/tables/:table', catalogController.tableExists); // Exists [NEW]
router.get('/:prefix/namespaces/:namespace/tables/:table', catalogController.loadTable); // Load
router.get('/:prefix/namespaces/:namespace/tables', catalogController.listTables); // List
router.post('/:prefix/namespaces/:namespace/tables', catalogController.createTable); // Create
router.post('/:prefix/namespaces/:namespace/register', catalogController.registerTable); // Register

router.post('/:prefix/tables/rename', catalogController.renameTable); // Rename [NEW]

router.post('/:prefix/namespaces/:namespace/tables/:table', catalogController.updateTable); // Update (Commit)
router.delete('/:prefix/namespaces/:namespace/tables/:table', catalogController.dropTable); // Drop

router.post('/:prefix/namespaces/:namespace/tables/:table/metrics', catalogController.reportMetrics);
router.post('/:prefix/namespaces/:namespace/tables/:table/notifications', catalogController.sendNotification);

router.post('/:prefix/transactions/commit', catalogController.commitTransaction);

/* --- Views --- */
router.head('/:prefix/namespaces/:namespace/views/:view', catalogController.viewExists); // Exists [NEW]
router.get('/:prefix/namespaces/:namespace/views/:view', catalogController.loadView); // Load
router.get('/:prefix/namespaces/:namespace/views', catalogController.listViews); // List
router.post('/:prefix/namespaces/:namespace/views', catalogController.createView); // Create
router.post('/:prefix/namespaces/:namespace/views/:view/replace', catalogController.replaceView); // Replace (Custom route possibly? Spec says post to view? No, View has replace route?)
// Spec for Replace View: POST /namespaces/{ns}/views/{view} (with body CreateViewRequest) ? 
// Actually Rest Spec for View Replace is usually POST to namespace/views but with 'replace' check? 
// Or POST /views/{view} with body?
// Let's check Spec... (Not visible effectively)
// Prototype used `replaceView` mapped to... `router.post('/:prefix/namespaces/:namespace/views/:view', catalogController.replaceView);`?
// Wait, createView is POST .../views
// Replace is typically PUT .../views/{view} or POST .../views/{view}
// I will map POST .../views/{view} to replaceView for now as it makes sense if create is on collection.
router.post('/:prefix/namespaces/:namespace/views/:view', catalogController.replaceView);

router.delete('/:prefix/namespaces/:namespace/views/:view', catalogController.dropView); // Drop
router.post('/:prefix/views/rename', catalogController.renameView); // Rename View (Spec: POST /v1/{prefix}/views/rename)

module.exports = router;
