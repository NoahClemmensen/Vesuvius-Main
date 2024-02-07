const DatabaseManager = require('../DatabaseManager');
var apiTokens = require('../routes/api');

var express = require('express');
var router = express.Router();

const db = DatabaseManager.getInstance();

const adminRoleId = 1;

function checkIfHasAdminPermission(cookie) {
    return cookie.role === adminRoleId;
}

function checkIfLoggedIn(req, res, adminRequired = false) {
    const sessionToken = req.cookies['sessionToken'];
    if (sessionToken === undefined) {
        res.render('login', {login: true, panel: true});
        return false;
    }

    const sessionTokenData = apiTokens.sessionTokens[sessionToken];
    if (sessionTokenData === undefined) {
        res.render('login', {login: true, panel: true});
        return false;
    }

    if (adminRequired) {
        if (!checkIfHasAdminPermission(sessionTokenData)){
            res.status(401);
            res.render('error' , { title: 'No permission', message: 'You do not have permission to access this page.', error: {status: 401, stack: ""}});
            return false;
        } else return true;
    } else return true;
}

/* GET users listing. */
router.get('/main', async function (req, res, next) {
    /* check if client is logged in, if not render login page */
    if (!checkIfLoggedIn(req, res, false)) {
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
    if (!checkIfLoggedIn(req, res, true)) {
        return;
    }

    res.render('admin/panel', {panel: true});
});

router.get('/admin/months', async function (req, res, next) {
    /* check if client is logged in, if not render login page */
    if (!checkIfLoggedIn(req, res, true)) {
        return;
    }

    // Get monthly sales
    // Load to table like in main panel
    try {
        const sales = await db.GetView("monthly_sales");
        console.log(sales);
        res.render('admin/monthProfit', {panel: true, tableData: sales});
    } catch (err) {
        console.log(err);
        res.render('panel', {panel: true, error: true, errorMessage: err});
    }
});

router.get('/admin/days', async function (req, res, next) {
    /* check if client is logged in, if not render login page */
    if (!checkIfLoggedIn(req, res, true)) {
        return;
    }

    const yearMonth = req.query.yearMonth;
    // Load to table like in main panel
    try {
        const sales = await db.GetMonthDailySales(yearMonth);

        res.render('admin/dayProfit', {panel: true, tableData: sales, month: yearMonth});
    } catch (err) {
        console.log(err);
        res.render('panel', {panel: true, error: true, errorMessage: err});
    }
});

router.get('/admin/menu', async function (req, res, next) {
    /* check if client is logged in, if not render login page */
    if (!checkIfLoggedIn(req, res, true)) {
        return;
    }

    try {
        const menu = await db.GetView('most_popular_items');
        res.render('admin/menu', {panel: true, tableData: menu});
    } catch (err) {
        console.log(err);
        res.render('panel', {panel: true, error: true, errorMessage: err});
    }
});

router.get('/admin/manageMenu', async function (req, res, next) {
    /* check if client is logged in, if not render login page */
    if (!checkIfLoggedIn(req, res, true)) {
        return;
    }

    try {
        const menu = await db.GetView('menu');
        const categories = await db.Query('SELECT * FROM Categories WHERE deleted = 0');
        const allergens = await db.Query('SELECT * FROM Allergens');

        console.log(menu);
        console.log(categories.recordset);
        console.log(allergens.recordset);

        res.render('admin/manageMenu', { menu: menu, categories: categories.recordset, allergens: allergens.recordset, panel: true });
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
});

module.exports = router;
