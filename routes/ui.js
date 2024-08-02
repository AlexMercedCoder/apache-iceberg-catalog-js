const express = require('express');
const router = express.Router();
const catalogController = require('../controllers/catalogController');

router.get('/', (req, res) => {
  const namespaces = catalogController.getCatalogService().listNamespaces();
  const tables = {};
  namespaces.forEach(namespace => {
    tables[namespace] = catalogController.getCatalogService().listTables(namespace);
  });

  res.render('index', { namespaces, tables });
});

router.post('/namespaces', (req, res) => {
  const { namespace } = req.body;
  try {
    catalogController.getCatalogService().createNamespace(namespace);
    res.redirect('/ui');
  } catch (error) {
    res.status(400).send(error.message);
  }
});

module.exports = router;