const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');

/**
 * @swagger
 * /v1/config:
 *   get:
 *     tags:
 *       - Configuration API
 *     summary: List all catalog configuration settings
 *     operationId: getConfig
 *     responses:
 *       200:
 *         description: Server specified configuration values.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overrides:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *                 defaults:
 *                   type: object
 *                   additionalProperties:
 *                     type: string
 *               example:
 *                 overrides: { "warehouse": "s3://bucket/warehouse/" }
 *                 defaults: { "clients": "4" }
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 */
router.get('/config', catalogController.getConfig);

/**
 * @swagger
 * /v1/oauth/tokens:
 *   post:
 *     tags:
 *       - OAuth2 API
 *     summary: Get a token using an OAuth2 flow
 *     operationId: getToken
 *     responses:
 *       200:
 *         $ref: '#/components/responses/OAuthTokenResponse'
 *       400:
 *         $ref: '#/components/responses/OAuthErrorResponse'
 *       401:
 *         $ref: '#/components/responses/OAuthErrorResponse'
 *       5XX:
 *         $ref: '#/components/responses/OAuthErrorResponse'
 */
router.post('/oauth/tokens', catalogController.getToken);

/**
 * @swagger
 * /v1/{prefix}/namespaces:
 *   get:
 *     tags:
 *       - Catalog API
 *     summary: List namespaces
 *     operationId: listNamespaces
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ListNamespacesResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               examples:
 *                 NoSuchNamespaceExample:
 *                   $ref: '#/components/examples/NoSuchNamespaceError'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.get('/:prefix/namespaces', catalogController.listNamespaces);

/**
 * @swagger
 * /v1/{prefix}/namespaces:
 *   post:
 *     tags:
 *       - Catalog API
 *     summary: Create a namespace
 *     operationId: createNamespace
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNamespaceRequest'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/CreateNamespaceResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       406:
 *         $ref: '#/components/responses/UnsupportedOperationResponse'
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               examples:
 *                 NamespaceAlreadyExists:
 *                   $ref: '#/components/examples/NamespaceAlreadyExistsError'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.post('/:prefix/namespaces', catalogController.createNamespace);

/**
 * @swagger
 * /v1/{prefix}/namespaces/{namespace}:
 *   get:
 *     tags:
 *       - Catalog API
 *     summary: Load the metadata properties for a namespace
 *     operationId: loadNamespaceMetadata
 *     responses:
 *       200:
 *         $ref: '#/components/responses/GetNamespaceResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               examples:
 *                 NoSuchNamespaceExample:
 *                   $ref: '#/components/examples/NoSuchNamespaceError'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.get('/:prefix/namespaces/:namespace', catalogController.loadNamespaceMetadata);

/**
 * @swagger
 * /v1/{prefix}/namespaces/{namespace}:
 *   delete:
 *     tags:
 *       - Catalog API
 *     summary: Drop a namespace from the catalog. Namespace must be empty.
 *     operationId: dropNamespace
 *     responses:
 *       204:
 *         description: Success, no content
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               examples:
 *                 NoSuchNamespaceExample:
 *                   $ref: '#/components/examples/NoSuchNamespaceError'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.delete('/:prefix/namespaces/:namespace', catalogController.dropNamespace);

/**
 * @swagger
 * /v1/{prefix}/namespaces/{namespace}/properties:
 *   post:
 *     tags:
 *       - Catalog API
 *     summary: Set or remove properties on a namespace
 *     operationId: updateProperties
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateNamespacePropertiesRequest'
 *           examples:
 *             UpdateAndRemoveProperties:
 *               $ref: '#/components/examples/UpdateAndRemoveNamespacePropertiesRequest'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/UpdateNamespacePropertiesResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               examples:
 *                 NamespaceNotFound:
 *                   $ref: '#/components/examples/NoSuchNamespaceError'
 *       406:
 *         $ref: '#/components/responses/UnsupportedOperationResponse'
 *       422:
 *         description: Unprocessable Entity
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               examples:
 *                 UnprocessableEntityDuplicateKey:
 *                   $ref: '#/components/examples/UnprocessableEntityDuplicateKey'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.post('/:prefix/namespaces/:namespace/properties', catalogController.updateProperties);

/**
 * @swagger
 * /v1/{prefix}/namespaces/{namespace}/tables:
 *   get:
 *     tags:
 *       - Catalog API
 *     summary: List all table identifiers underneath a given namespace
 *     operationId: listTables
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ListTablesResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               examples:
 *                 NamespaceNotFound:
 *                   $ref: '#/components/examples/NoSuchNamespaceError'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.get('/:prefix/namespaces/:namespace/tables', catalogController.listTables);

/**
 * @swagger
 * /v1/{prefix}/namespaces/{namespace}/tables:
 *   post:
 *     tags:
 *       - Catalog API
 *     summary: Create a table in the given namespace
 *     operationId: createTable
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTableRequest'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/CreateTableResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               examples:
 *                 NamespaceNotFound:
 *                   $ref: '#/components/examples/NoSuchNamespaceError'
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               examples:
 *                 NamespaceAlreadyExists:
 *                   $ref: '#/components/examples/TableAlreadyExistsError'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.post('/:prefix/namespaces/:namespace/tables', catalogController.createTable);

/**
 * @swagger
 * /v1/{prefix}/namespaces/{namespace}/register:
 *   post:
 *     tags:
 *       - Catalog API
 *     summary: Register a table in the given namespace using given metadata file location
 *     operationId: registerTable
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterTableRequest'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/LoadTableResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               examples:
 *                 NamespaceNotFound:
 *                   $ref: '#/components/examples/NoSuchNamespaceError'
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               examples:
 *                 NamespaceAlreadyExists:
 *                   $ref: '#/components/examples/TableAlreadyExistsError'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.post('/:prefix/namespaces/:namespace/register', catalogController.registerTable);

/**
 * @swagger
 * /v1/{prefix}/namespaces/{namespace}/tables/{table}:
 *   get:
 *     tags:
 *       - Catalog API
 *     summary: Load a table from the catalog
 *     operationId: loadTable
 *     responses:
 *       200:
 *         $ref: '#/components/responses/LoadTableResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               examples:
 *                 TableToLoadDoesNotExist:
 *                   $ref: '#/components/examples/NoSuchTableError'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.get('/:prefix/namespaces/:namespace/tables/:table', catalogController.loadTable);

/**
 * @swagger
 * /v1/{prefix}/namespaces/{namespace}/tables/{table}:
 *   post:
 *     tags:
 *       - Catalog API
 *     summary: Commit updates to a table
 *     operationId: updateTable
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommitTableRequest'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/CommitTableResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               examples:
 *                 TableToUpdateDoesNotExist:
 *                   $ref: '#/components/examples/NoSuchTableError'
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               example: 
 *                 error: 
 *                   message: Internal Server Error
 *                   type: CommitStateUnknownException
 *                   code: 500
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       502:
 *         description: Bad Gateway
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               example:
 *                 error:
 *                   message: Invalid response from the upstream server
 *                   type: CommitStateUnknownException
 *                   code: 502
 *       504:
 *         description: Gateway Timeout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               example:
 *                 error:
 *                   message: Gateway timed out during commit
 *                   type: CommitStateUnknownException
 *                   code: 504
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.post('/:prefix/namespaces/:namespace/tables/:table', catalogController.updateTable);

/**
 * @swagger
 * /v1/{prefix}/namespaces/{namespace}/tables/{table}/metrics:
 *   post:
 *     tags:
 *       - Catalog API
 *     summary: Send a metrics report to this endpoint to be processed by the backend
 *     operationId: reportMetrics
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReportMetricsRequest'
 *     responses:
 *       204:
 *         description: Success, no content
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               examples:
 *                 TableToLoadDoesNotExist:
 *                   $ref: '#/components/examples/NoSuchTableError'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.post('/:prefix/namespaces/:namespace/tables/:table/metrics', catalogController.reportMetrics);

/**
 * @swagger
 * /v1/{prefix}/namespaces/{namespace}/tables/{table}/notifications:
 *   post:
 *     tags:
 *       - Catalog API
 *     summary: Sends a notification to the table
 *     operationId: sendNotification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationRequest'
 *     responses:
 *       204:
 *         description: Success, no content
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               examples:
 *                 TableToLoadDoesNotExist:
 *                   $ref: '#/components/examples/NoSuchTableError'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.post('/:prefix/namespaces/:namespace/tables/:table/notifications', catalogController.sendNotification);

/**
 * @swagger
 * /v1/{prefix}/transactions/commit:
 *   post:
 *     tags:
 *       - Catalog API
 *     summary: Commit updates to multiple tables in an atomic operation
 *     operationId: commitTransaction
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommitTransactionRequest'
 *     responses:
 *       204:
 *         description: Success, no content
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               examples:
 *                 TableToUpdateDoesNotExist:
 *                   $ref: '#/components/examples/NoSuchTableError'
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               example: 
 *                 error: 
 *                   message: Internal Server Error
 *                   type: CommitStateUnknownException
 *                   code: 500
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       502:
 *         description: Bad Gateway
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               example:
 *                 error:
 *                   message: Invalid response from the upstream server
 *                   type: CommitStateUnknownException
 *                   code: 502
 *       504:
 *         description: Gateway Timeout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IcebergErrorResponse'
 *               example:
 *                 error:
 *                   message: Gateway timed out during commit
 *                   type: CommitStateUnknownException
 *                   code: 504
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.post('/:prefix/transactions/commit', catalogController.commitTransaction);

/**
 * @swagger
 * /v1/{prefix}/namespaces/{namespace}/views:
 *   get:
 *     tags:
 *       - Catalog API
 *     summary: List all view identifiers underneath a given namespace
 *     operationId: listViews
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ListTablesResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorModel'
 *               examples:
 *                 NamespaceNotFound:
 *                   $ref: '#/components/examples/NoSuchNamespaceError'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.get('/:prefix/namespaces/:namespace/views', catalogController.listViews);

/**
 * @swagger
 * /v1/{prefix}/namespaces/{namespace}/views:
 *   post:
 *     tags:
 *       - Catalog API
 *     summary: Create a view in the given namespace
 *     operationId: createView
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateViewRequest'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/LoadViewResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorModel'
 *               examples:
 *                 NamespaceNotFound:
 *                   $ref: '#/components/examples/NoSuchNamespaceError'
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorModel'
 *               examples:
 *                 NamespaceAlreadyExists:
 *                   $ref: '#/components/examples/ViewAlreadyExistsError'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.post('/:prefix/namespaces/:namespace/views', catalogController.createView);

/**
 * @swagger
 * /v1/{prefix}/namespaces/{namespace}/views/{view}:
 *   get:
 *     tags:
 *       - Catalog API
 *     summary: Load a view from the catalog
 *     operationId: loadView
 *     responses:
 *       200:
 *         $ref: '#/components/responses/LoadViewResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorModel'
 *               examples:
 *                 ViewToLoadDoesNotExist:
 *                   $ref: '#/components/examples/NoSuchViewError'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.get('/:prefix/namespaces/:namespace/views/:view', catalogController.loadView);

/**
 * @swagger
 * /v1/{prefix}/namespaces/{namespace}/views/{view}:
 *   post:
 *     tags:
 *       - Catalog API
 *     summary: Replace a view
 *     operationId: replaceView
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommitViewRequest'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/LoadViewResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorModel'
 *               examples:
 *                 ViewToUpdateDoesNotExist:
 *                   $ref: '#/components/examples/NoSuchViewError'
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorModel'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       500:
 *         description: Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorModel'
 *               example: 
 *                 error: 
 *                   message: Internal Server Error
 *                   type: CommitStateUnknownException
 *                   code: 500
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       502:
 *         description: Bad Gateway
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorModel'
 *               example:
 *                 error:
 *                   message: Invalid response from the upstream server
 *                   type: CommitStateUnknownException
 *                   code: 502
 *       504:
 *         description: Gateway Timeout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorModel'
 *               example:
 *                 error:
 *                   message: Gateway timed out during commit
 *                   type: CommitStateUnknownException
 *                   code: 504
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.post('/:prefix/namespaces/:namespace/views/:view', catalogController.replaceView);

/**
 * @swagger
 * /v1/{prefix}/namespaces/{namespace}/views/{view}:
 *   delete:
 *     tags:
 *       - Catalog API
 *     summary: Drop a view from the catalog
 *     operationId: dropView
 *     responses:
 *       204:
 *         description: Success, no content
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorModel'
 *               examples:
 *                 ViewToDeleteDoesNotExist:
 *                   $ref: '#/components/examples/NoSuchViewError'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.delete('/:prefix/namespaces/:namespace/views/:view', catalogController.dropView);

/**
 * @swagger
 * /v1/{prefix}/views/rename:
 *   post:
 *     tags:
 *       - Catalog API
 *     summary: Rename a view from its current name to a new name
 *     operationId: renameView
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RenameTableRequest'
 *           examples:
 *             RenameViewSameNamespace:
 *               $ref: '#/components/examples/RenameViewSameNamespace'
 *     responses:
 *       204:
 *         description: Success, no content
 *       400:
 *         $ref: '#/components/responses/BadRequestErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedResponse'
 *       403:
 *         $ref: '#/components/responses/ForbiddenResponse'
 *       404:
 *         description: Not Found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorModel'
 *               examples:
 *                 ViewToRenameDoesNotExist:
 *                   $ref: '#/components/examples/NoSuchViewError'
 *                 NamespaceToRenameToDoesNotExist:
 *                   $ref: '#/components/examples/NoSuchNamespaceError'
 *       406:
 *         $ref: '#/components/responses/UnsupportedOperationResponse'
 *       409:
 *         description: Conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorModel'
 *               example:
 *                 $ref: '#/components/examples/ViewAlreadyExistsError'
 *       419:
 *         $ref: '#/components/responses/AuthenticationTimeoutResponse'
 *       503:
 *         $ref: '#/components/responses/ServiceUnavailableResponse'
 *       5XX:
 *         $ref: '#/components/responses/ServerErrorResponse'
 */
router.post('/:prefix/views/rename', catalogController.renameView);

module.exports = router;
