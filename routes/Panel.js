const DatabaseManager = require('../DatabaseManager');

var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    const db = DatabaseManager.getInstance();
    db.connect()
        .then(() => {
            db.query("SELECT * FROM Tables")
        })
        .finally(() => {
            db.disconnect()
        });

    res.render('panel', { title: 'Panel' });
});

module.exports = router;
