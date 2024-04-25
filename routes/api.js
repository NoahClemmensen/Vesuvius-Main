const DatabaseManager = require("../DatabaseManager");
const bcrypt = require('bcrypt');
require('dotenv').config();

var express = require('express');
var router = express.Router();

var adminRouter = require('./adminApi');
var staffRouter = require('./staffApi');

const db = DatabaseManager.getInstance();

// This matches the DB id's
// If they are changed, it should change within the db. Find a way to do it dynamically
const adminRoleId = 1;
const API_ACCESS_LEVELS = {
    ADMIN: 1,
    STAFF: 2,
    CUSTOMER: 3
};

// RAM Stored session tokens
// If restarted people will be logged out.
var sessionTokens = {};

// Debug request handlers
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

// Request handlers
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

router.use('/admin', adminRouter);
router.use('/', staffRouter);

module.exports = { router, sessionTokens };