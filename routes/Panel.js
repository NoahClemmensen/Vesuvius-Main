const DatabaseManager = require('../DatabaseManager');

var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
    const db = DatabaseManager.getInstance();
    db.Query("SELECT * FROM Tables")
        .then(result => {
            console.log(result);
        });

    res.render('panel', { title: 'Panel' });
});

module.exports = router;
