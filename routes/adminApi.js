var express = require('express');
var router = express.Router();
const db = require("../DatabaseManager").getInstance();
const bcrypt = require('bcrypt');

// Helper function to convert json to csv
function jsonToCSV(json) {
    const keys = Object.keys(json[0]);
    let csv = keys.join(";") + "\n";

    for (let i = 0; i < json.length; i++) {
        const values = Object.values(json[i]);
        csv += values.join(";") + "\n";
    }

    return csv;
}

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

router.post('/getDailySalesCSV', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
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

router.post('/addCategory', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    const categoryName = req.body.addCategoryNameInput;

    try {
        await db.AddCategory(categoryName);
        res.status(200).send("Category added successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/addMenuItem', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
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

router.post('/deleteMenuItem', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    const menuItemId = req.body.menuItemId;

    try {
        await db.DeleteMenuItem(menuItemId);
        res.status(200).send("Menu item deleted successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/deleteCategory', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    const categoryId = req.body.categoryId;

    try {
        await db.DeleteCategory(categoryId);
        res.status(200).send("Category deleted successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/flagItem', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    const menuItemId = req.body.menuItemId;

    try {
        await db.FlagMenuItem(menuItemId);
        res.status(200).send("Item flagged successfully");
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/removeStaff', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    const staffId = req.body.id;

    try {
        const result = await db.DeleteUser(staffId);
        res.status(200).send(result);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/changeStaffRole', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
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

router.post('/registerStaff', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
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

router.get('/getMonthlyChart', authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    try {
        const sales = await db.GetView("monthly_sales");
        res.status(200).send(sales);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

router.post('/getDailyChart' , authenticateApiKey(API_ACCESS_LEVELS.ADMIN), async function (req, res, next) {
    const yearMonth = req.body.yearMonth;

    try {
        const sales = await db.GetMonthDailySales(yearMonth);
        res.status(200).send(sales);
    } catch (err) {
        console.log(err);
        res.status(500).send({error: err});
    }
});

module.exports = router;