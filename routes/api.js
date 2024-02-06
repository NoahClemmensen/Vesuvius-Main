const DatabaseManager = require("../DatabaseManager");
const bcrypt = require('bcrypt');

var express = require('express');
var router = express.Router();

const db = DatabaseManager.getInstance();
const adminRoleId = 1;

var sessionTokens = {};

function checkIfHasAdminPermission(cookie) {
    return cookie.role === adminRoleId;
}

function checkIfAuthorized(req, res, adminRequired = false) {
    const sessionToken = req.cookies['sessionToken'];
    if (sessionToken === undefined) {
        res.status(401).send({error: "Unauthorized"});
        return false;
    }

    const sessionTokenData = sessionTokens[sessionToken];
    if (sessionTokenData === undefined) {
        res.status(401).send({error: "Unauthorized"});
        return false;
    }


    if (adminRequired) {
        if (!checkIfHasAdminPermission(sessionTokenData)){
            res.status(401).send({error: "Unauthorized"});
            return false;
        } else return true;
    } else return true;
}

function jsonToCSV(json) {
    const keys = Object.keys(json[0]);
    let csv = keys.join(";") + "\n";

    for (let i = 0; i < json.length; i++) {
        const values = Object.values(json[i]);
        csv += values.join(";") + "\n";
    }

    return csv;
}

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
        res.send(e);
        res.status(500);
    }
});

router.post('/login', async function(req, res, next) {
    const username = req.body.username;
    const password = req.body.password;

    try {
        const userResult = await db.CheckForMatchingLogin(username);
        if (userResult.length === 0) {
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

router.post('/genHashedPassword', async function(req, res, next) {
    const password = req.body.password;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        res.send(hashedPassword);
        res.status(200);
    } catch (e) {
        console.log(e);
        res.send(e);
        res.status(500);
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

router.get('/admin/getMonthlyChart', async function (req, res, next) {
    if (checkIfAuthorized(req, res, next) === false) {
        return;
    }

    try {
        const sales = await db.GetView("monthly_sales");
        res.status(200).send(sales);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/admin/getDailyChart', async function (req, res, next) {
    if (checkIfAuthorized(req, res, next) === false) {
        return;
    }

    const yearMonth = req.body.yearMonth;

    try {
        const sales = await db.GetMonthDailySales(yearMonth);
        res.status(200).send(sales);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/admin/getDailySalesCSV', async function (req, res, next) {
    if (checkIfAuthorized(req, res, next) === false) {
        return;
    }

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

router.post('/admin/addCategory', async function (req, res, next) {
    if (checkIfAuthorized(req, res, next) === false) {
        return;
    }

    const categoryName = req.body.addCategoryNameInput;

    try {
        await db.AddCategory(categoryName);
        res.status(200).send("Category added successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/admin/addMenuItem', async function (req, res, next) {
    if (checkIfAuthorized(req, res, next) === false) {
        return;
    }

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

module.exports = { router, sessionTokens };
