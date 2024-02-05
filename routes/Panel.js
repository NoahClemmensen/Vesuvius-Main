const DatabaseManager = require('../DatabaseManager');
var apiTokens = require('../routes/api');

var express = require('express');
var router = express.Router();

const db = DatabaseManager.getInstance();

function checkIfLoggedIn(req, res) {
    const sessionToken = req.cookies['sessionToken'];
    if (sessionToken === undefined) {
        res.render('login', {login: true, panel: true});
        return false;
    }

    const sessionTokenData = apiTokens.sessionTokens.find(token => token.token === sessionToken);
    if (sessionTokenData === undefined) {
        res.render('login', {login: true, panel: true});
        return false;
    }

    return true;
}

/* GET users listing. */
router.get('/main', async function (req, res, next) {
    /* check if client is logged in, if not render login page */
    if (!checkIfLoggedIn(req, res)) {
        return;
    }

    try {
        let result = await db.GetView("main_overview");

        res.render('panel', {panel: true, tableData: result });
    } catch (err) {
        console.log(err);
        res.render('panel', {panel: true, error: true, errorMessage: err});
    }
});

router.get('/', async function (req, res, next) {
    res.render('login', {login: true, panel: true});
});

router.get('/admin', async function (req, res, next) {
    /* check if client is logged in, if not render login page */
    if (!checkIfLoggedIn(req, res)) {
        return;
    }

    // Get monthly sales
    // Load to table like in main panel
    try {
        const sales = await db.GetView("monthly_sales");
        console.log(sales);
        res.render('admin', {panel: true, tableData: sales});
    } catch (err) {
        console.log(err);
        res.render('panel', {panel: true, error: true, errorMessage: err});
    }
});

router.get('/admin/month', async function (req, res, next) {
    /* check if client is logged in, if not render login page */
    if (!checkIfLoggedIn(req, res)) {
        return;
    }

    const yearMonth = req.query.yeahMonth;
    // Load to table like in main panel
    try {
        const sales = await db.GetMonthDailySales(yearMonth);

        res.render('adminMonth', {panel: true, tableData: sales, month: yearMonth});
    } catch (err) {
        console.log(err);
        res.render('panel', {panel: true, error: true, errorMessage: err});
    }
});

module.exports = router;
