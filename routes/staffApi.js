var express = require('express');
var router = express.Router();
const db = require("../DatabaseManager").getInstance();

// This matches the DB id's
// If they are changed, it should change within the db. Find a way to do it dynamically
const adminRoleId = 1;
const API_ACCESS_LEVELS = {
    ADMIN: 1,
    STAFF: 2,
    CUSTOMER: 3
};

// Middle-kinda-ware
function authenticateApiKey(requiredAccessLevel) {
    return function(req, res, next) {
        try {
            const apiKey = req.headers['x-api-key'] || req.headers['authorization'].split(' ')[1] || req.cookies['api-key'];
            if (!apiKey) {
                console.log("No API key provided")
                res.status(401).send({error: "Unauthorized: No API key provided"});
                return;
            }

            db.CheckApiKey(apiKey)
                .then(accessLevel => {
                    if (accessLevel.length === 0) {
                        console.log("Invalid API key")
                        res.status(401).send({error: "Unauthorized: Invalid API key"});
                        return;
                    }

                    if (accessLevel[0].access_level > requiredAccessLevel) {
                        console.log("Insufficient access level")
                        res.status(403).send({error: "Forbidden: Insufficient access level"});
                        return;
                    }

                    next();
                })
                .catch(err => {
                    console.error(err);
                    res.status(500).send({error: "Server error"});
                });
        } catch (err) {
            res.status(401).send({error: "Unauthorized: Insufficient access level"});
        }
    }
}

router.get('/getMenu', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function (req, res, next) {
    try {
        const menu = await db.GetView('menu');
        res.status(200).json(menu);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.get('/getTables', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function (req, res, next) {
    try {
        const tables = await db.GetView('main_overview');
        res.status(200).json(tables);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.get('/getTableOverview', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function (req, res, next) {
    try {
        const tables = await db.GetView('table_view');
        res.status(200).json(tables);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

router.get('/getCategories', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function (req, res, next) {
    try {
        const categories = await db.Query('SELECT * FROM categories WHERE deleted = 0');
        res.status(200).json(categories.recordset);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.get('/getMenuItemsByCategory', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function (req, res, next) {
    try {
        const categoryId = req.query.category;
        const menuItems = await db.Query('SELECT * FROM menu WHERE category_id = ' + categoryId);

        res.status(200).json(menuItems.recordset);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.get('/getSingleTableOverview', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function (req, res, next) {
    try {
        const tableNum = req.query.tableNum;
        const singleTableOverview = await db.Query('Select * from single_table_overview where table_num = ' + tableNum);

        res.status(200).json(singleTableOverview.recordset);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
})

router.get('/getTotalPriceForTable', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function (req, res, next) {
    const tableNum = req.query.tableNum;
    try {
        const price = await db.GetTotalPriceForTable(tableNum);
        res.status(200).send(price[0]);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
})

router.post('/payForOrder', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function (req, res, next) {
    const orderId = req.body.order;
    const status = 4;
    try {
        await db.ChangeStatus(orderId, status);
        res.status(200).send("Paid for order");
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/changeFlag', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function (req, res, next) {
    const tableNum = req.body.tableNum;
    try {
        await db.ChangeFlag(tableNum);
        res.status(200).send("Status changed");
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.get('/getOrders', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function(req, res, next) {
    try {
        var data = []

        const orders = await db.GetView('kitchen_view');
        for (const order of orders) {
            var orderData = order;

            const items = await db.Query('select * from order_items_view where order_id = ' + order._id);
            orderData.items = items.recordset;
            data.push(orderData);
        }

        res.status(200).json(data);
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }

});

router.get('/getWaiterView', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function(req, res, next) {
    try {
        const tables = await db.GetView('waiter_view');
        res.status(200).json(tables);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

router.post('/sendOrder', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function(req, res, next) {
    const menuOptions = req.body.MenuOptions;
    const notes = req.body.Notes;

    try {
        const order = await db.CreateOrder(req.body.Table._id, notes);
        const orderId = order[0].order_id;
        console.log(req.body);

        for (let i = 0; i < menuOptions.length; i++) {
            const option = menuOptions[i];
            await db.AddOrderItem(orderId, option._id);
        }

        res.status(200).send("Order sent successfully");
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }
});

module.exports = router;