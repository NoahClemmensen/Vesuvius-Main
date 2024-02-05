const DatabaseManager = require('../DatabaseManager');
var apiTokens = require('../routes/api');

var express = require('express');
var router = express.Router();

const db = DatabaseManager.getInstance();

/* GET users listing. */
router.get('/main', async function (req, res, next) {
    /* check if client is logged in, if not render login page */
    const sessionToken = req.cookies['sessionToken'];
    if (sessionToken === undefined) {
        res.render('login', {title: 'Login', login: true, panel: true});
        return;
    }

    const sessionTokenData = apiTokens.sessionTokens.find(token => token.token === sessionToken);
    console.log(sessionTokenData);
    if (sessionTokenData === undefined) {
        res.render('login', {title: 'Login', login: true, panel: true});
        return;
    }

    try {
        let result = await db.Query("select * from main_overview");

        res.render('panel', {title: 'Panel', panel: true, tableData: result.recordset });
    } catch (err) {
        console.log(err);
        res.render('panel', {title: 'Panel', panel: true, error: true, errorMessage: err});
    }
});

router.get('/admin', async function (req, res, next) {

});

module.exports = router;
