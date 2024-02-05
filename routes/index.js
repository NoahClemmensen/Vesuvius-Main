const DatabaseManager = require('../DatabaseManager');

var express = require('express');
var router = express.Router();

const db = DatabaseManager.getInstance();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {  });
});

router.get('/reservate', function(req, res, next) {
  res.render('reservate', {  });
});

router.get('/menu', async function(req, res, next) {
    const menu = await db.GetView('menu');
    console.log(menu);
    const categories = await db.Query('SELECT * FROM Categories');
    console.log(categories.recordset);
    res.render('menu', { menu: menu, categories: categories.recordset });
});

module.exports = router;
