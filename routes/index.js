const DatabaseManager = require('../DatabaseManager');

var express = require('express');
var router = express.Router();

const db = DatabaseManager.getInstance();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {  });
});

router.get('/about-us', function(req, res, next) {
    res.render('aboutUs', { chinese: true });
});

router.get('/reservate', function(req, res, next) {
  res.render('reservate', {  });
});

router.get('/menu', async function(req, res, next) {
    try {
        const menu = await db.GetView('menu');
        const categories = await db.Query('SELECT * FROM Categories WHERE deleted = 0');
        const allergies = await db.Query('SELECT * FROM Allergens');

        res.render('menu', { menu: menu, categories: categories.recordset, allergies: allergies.recordset });
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
});

module.exports = router;
