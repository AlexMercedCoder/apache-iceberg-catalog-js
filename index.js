const express = require('express');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const catalogRoutes = require('./routes/catalog');
const uiRoutes = require('./routes/ui');
const logger = require('./logger');
const catalogController = require('./controllers/catalogController');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');

const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Apache Iceberg REST Catalog API',
      version: '0.0.1',
      description: 'Defines the specification for the first version of the REST Catalog API.',
    },
  },
  apis: ['./routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));
app.use('/v1', catalogRoutes);
app.use('/ui', uiRoutes);

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Initialize DB and start server
(async () => {
    try {
        const service = catalogController.getCatalogService();
        await service.init();
        logger.info('Database initialized successfully.');

        app.listen(port, () => {
          logger.info(`Server running at http://localhost:${port}`);
        });
    } catch (err) {
        logger.error(`Failed to initialize database: ${err.message}`);
        process.exit(1);
    }
})();
