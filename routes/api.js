const DatabaseManager = require("../DatabaseManager");
const bcrypt = require('bcrypt');
require('dotenv').config();

var express = require('express');
var router = express.Router();

const db = DatabaseManager.getInstance();
const adminRoleId = 1;

const API_ACCESS_LEVELS = {
    ADMIN: 1,
    STAFF: 2,
    CUSTOMER: 3
};

var sessionTokens = {};

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

/**
 * Convert JSON to CSV.
 * @param {Object} json - The JSON object.
 * @return {string} The CSV string.
 */
function jsonToCSV(json) {
    const keys = Object.keys(json[0]);
    let csv = keys.join(";") + "\n";

    for (let i = 0; i < json.length; i++) {
        const values = Object.values(json[i]);
        csv += values.join(";") + "\n";
    }

    return csv;
}

/*
router.get('/checkCookie', function (req, res, next) {
    const sessionToken = req.cookies['sessionToken'];

    const sessionTokenData = sessionTokens.find(token => token.token === sessionToken);

    if (sessionTokenData) {
        res.status(200);
        res.send();
    } else {
        res.status(500);
        res.send();
    }
});

router.get('/todoitems', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function(req, res, next) {
    res.status(200).send(todoItems);
});

router.get('/staffAndUp', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function(req, res, next) {
    res.status(200).send("You are staff");
});

router.get('/ikfiojf', async function(req, res, next) {
    const selects = await db.Query('SELECT * FROM test')
    console.log(selects);
    res.status(200).send("yay :)");
});

router.get('/adminOnly', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function(req, res, next) {
    res.status(200).send("You are admin");
});

router.post('/genPass', async function(req, res, next) {
    const password = req.body.password;
    const hashedPassword = await bcrypt.hash(password, 10);
    res.send(hashedPassword);
});
*/

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

router.post('/getAvailableTables', async function(req, res, next) {
    try {
        const tables = await db.GetAvailableTables(req.body.selectedTime);
        res.send(tables);
        res.status(200);
    } catch (e) {
        res.send(e);
        res.status(500);
    }
});

router.post('/makeReservation', async function(req, res, next) {
    // Check if reservation time is in the future
    const now = new Date();
    const reservationTime = new Date(req.body.time);
    if (reservationTime < now) {
        res.send("Reservation time is in the past");
        res.status(500);
        return;
    }

    try {
        // Check if enough tables are available
        const tables = await db.GetAvailableTables(req.body.time);
        const availableTables = tables.length;
        const tablesNeeded = Math.ceil(req.body.guests / 2);

        if (tablesNeeded > availableTables) {
            console.log("Not enough tables available");
            res.send("Not enough tables available");
            res.status(500);
            return;
        }

        // Make reservation
        const result = await db.MakeReservation(
            req.body.time,
            req.body.name,
            req.body.phone,
        );

        const reservationId = result[0].ReservationId;

        // TODO: Make sure tables are *still* available if two people reservation at the same time

        // Add tables to reservation
        for (let i = 0; i < tablesNeeded; i++) {
            await db.AddTableToReservation(
                tables[i]._id,
                reservationId
            )
        }

        res.status(200);
        res.send("Reservation made successfully");
    } catch (e) {
        console.log(e)
        res.status(500);
        res.send(e);
    }
});

router.post('/login', async function(req, res, next) {
    const sessionToken = req.cookies['sessionToken'];
    if (sessionToken !== undefined) {
        const sessionTokenData = sessionTokens[sessionToken];
        if (sessionTokenData !== undefined) {
            res.status(200);
            console.log("Already logged in");
            res.json({error: "Already logged in"});
            return;
        }
    }

    const username = req.body.username;
    const password = req.body.password;

    try {
        const userResult = await db.CheckForMatchingLogin(username);
        if (userResult.length === 0) {
            console.log("Invalid username or password");
            res.status(500);
            res.json({error: "Invalid username or password"});
            return;
        }
        const role = userResult[0].role;
        const compareResult = await bcrypt.compare(password, userResult[0].password);

        if (compareResult) {
            // Generate and save session token and send it to the client
            const sessionToken = await bcrypt.hash(username, 10);
            sessionTokens[sessionToken] = {
                username: username,
                role: role
            };

            res.cookie('sessionToken', sessionToken, { maxAge: 900000, httpOnly: true });
            res.cookie('role', role, { maxAge: 900000, httpOnly: false })

            if (role === adminRoleId) {
                res.cookie('api-key', process.env.API_KEY_ADMIN, { maxAge: 900000, httpOnly: false })
                res.json({key: process.env.API_KEY_ADMIN});
            } else {
                res.cookie('api-key', process.env.API_KEY_STAFF, { maxAge: 900000, httpOnly: false })
                res.json({key: process.env.API_KEY_STAFF});
            }

            res.status(200);
        } else {
            res.status(500);
            console.log("Invalid username or password")
            res.json({error: "Invalid username or password"});
        }
    } catch (e) {
        res.status(500);
        res.json({error: "Server error -> " + e});
    }
});

router.post('/logout', async function(req, res, next) {
    try {
        const sessionToken = req.cookies['sessionToken'];
        delete sessionTokens[sessionToken];

        res.clearCookie('sessionToken');
        res.clearCookie('role');
        res.status(200);
        res.send("Logged out successfully");
    } catch (e) {
        console.log(e);
        res.status(500).send(e);
    }

});

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

router.get('/admin/getMonthlyChart', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    try {
        const sales = await db.GetView("monthly_sales");
        res.status(200).send(sales);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/admin/getDailyChart' , authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    const yearMonth = req.body.yearMonth;

    try {
        const sales = await db.GetMonthDailySales(yearMonth);
        res.status(200).send(sales);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

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

router.post('/admin/getDailySalesCSV', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    const yearMonth = req.body.yearMonth;

    try {
        const sales = await db.GetMonthDailySales(yearMonth);
        const csv = jsonToCSV(sales);

        res.status(200).send(csv);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/admin/addCategory', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    const categoryName = req.body.addCategoryNameInput;

    try {
        await db.AddCategory(categoryName);
        res.status(200).send("Category added successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/admin/addMenuItem', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    const name = req.body.addItemNameInput;
    const description = req.body.addItemDescriptionInput;
    const retailPrice = req.body.addItemRetailInput;
    const price = req.body.addItemPriceInput;
    const category = req.body.categorySelect;

    try {
        const menuItem = await db.AddMenuItem(name, price, description, category, retailPrice);
        const menuItemId = menuItem[0].id;

        // loop through all the properties of req.body that contains allergen
        for (const [key, value] of Object.entries(req.body)) {
            if (key.includes("allergen")) {
                await db.AddAllergeneToMenuItem(menuItemId, value);
            }
        }
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }

    res.status(200).send("Menu item added successfully");
});

router.post('/admin/deleteMenuItem', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    const menuItemId = req.body.menuItemId;

    try {
        await db.DeleteMenuItem(menuItemId);
        res.status(200).send("Menu item deleted successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/admin/deleteCategory', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    const categoryId = req.body.categoryId;

    try {
        await db.DeleteCategory(categoryId);
        res.status(200).send("Category deleted successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/admin/flagItem', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    const menuItemId = req.body.menuItemId;

    try {
        await db.FlagMenuItem(menuItemId);
        res.status(200).send("Item flagged successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/admin/removeStaff', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    const staffId = req.body.id;

    try {
        const result = await db.DeleteUser(staffId);
        res.status(200).send(result);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/admin/changeStaffRole', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    const staffId = req.body.staffId;
    const roleId = req.body.roleId;
    console.log(staffId, roleId);

    try {
        const result = await db.ChangeUserRole(staffId, roleId);
        res.status(200).send(result);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/admin/registerStaff', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    const username = req.body.registerStaffUsername;
    const password = req.body.registerStaffPassword;
    const roleId = req.body.registerRoleSelect;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await db.RegisterUser(username, hashedPassword, roleId);
        res.status(200).send(result);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

module.exports = { router, sessionTokens };
