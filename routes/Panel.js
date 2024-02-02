const DatabaseManager = require('../DatabaseManager');

var express = require('express');
var router = express.Router();

const db = DatabaseManager.getInstance();

/* GET users listing. */
router.get('/', async function (req, res, next) {
    try {
        let result = await db.Query("select * from main_overview");

        res.render('panel', {title: 'Panel', panel: true, tableData: result.recordset });
    } catch (err) {
        console.log(err);
        res.render('panel', {title: 'Panel', panel: true, error: true, errorMessage: err});
    }
});

module.exports = router;
