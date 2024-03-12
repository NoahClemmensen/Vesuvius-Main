const DatabaseManager = require("../DatabaseManager");
const bcrypt = require('bcrypt');

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
var todoItems = [
    {
        Id: 1,
        Title: "Do the dishes",
        IsComplete: false
    },
    {
        Id: 2,
        Title: "Walk the dog",
        IsComplete: true
    },
];

function authenticateApiKey(requiredAccessLevel) {
    return function(req, res, next) {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            res.status(401).send({error: "Unauthorized: No API key provided"});
            return;
        }

        db.CheckApiKey(apiKey)
            .then(accessLevel => {
                if (accessLevel.length === 0) {
                    res.status(401).send({error: "Unauthorized: Invalid API key"});
                    return;
                }

                if (accessLevel[0].access_level > requiredAccessLevel) {
                    res.status(403).send({error: "Forbidden: Insufficient access level"});
                    return;
                }

                next();
            })
            .catch(err => {
                console.error(err);
                res.status(500).send({error: "Server error"});
            });
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


router.post('/todoitems', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function(req, res, next) {
    todoItems[req.body.Id] = req.body;
    console.log(req.body)
    res.status(200).send(todoItems);
});

router.get('/todoitems', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function(req, res, next) {
    res.status(200).send(todoItems);
});

router.put('/todoitems', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function(req, res, next) {
    todoItems[req.body.Id] = req.body;
    res.status(200).send(todoItems);
});

router.delete('/todoitems', authenticateApiKey(API_ACCESS_LEVELS.STAFF), async function(req, res, next) {
    delete todoItems[req.body.Id];
    res.status(200).send(todoItems);
});

router.post('/getAvailableTables', authenticateApiKey(API_ACCESS_LEVELS.CUSTOMER), async function(req, res, next) {
    try {
        const tables = await db.GetAvailableTables(req.body.selectedTime);
        res.send(tables);
        res.status(200);
    } catch (e) {
        res.send(e);
        res.status(500);
    }
});

router.post('/makeReservation', authenticateApiKey(API_ACCESS_LEVELS.CUSTOMER), async function(req, res, next) {
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
            res.send("Already logged in");
            return;
        }
    }

    const username = req.body.username;
    const password = req.body.password;

    console.log(username, password);

    try {
        const userResult = await db.CheckForMatchingLogin(username);
        if (userResult.length === 0) {
            res.status(500);
            res.json({error: "Invalid username or password"});
            return;
        }
        const role = userResult[0].role;

        console.log(password, userResult[0].password)
        const compareResult = await bcrypt.compare(password, userResult[0].password);
        console.log(compareResult);

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
                res.cookie('api-key', 'admin', { maxAge: 900000, httpOnly: false })
            } else {
                res.cookie('api-key', 'staff', { maxAge: 900000, httpOnly: false })
            }

            res.status(200);
            res.send("Logged in successfully");
        } else {
            res.status(500);
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
    const retailPrice = req.body.addItemPriceInput;
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
