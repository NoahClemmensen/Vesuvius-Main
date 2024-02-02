const DatabaseManager = require("../DatabaseManager");
const bcrypt = require('bcrypt');


var express = require('express');
var router = express.Router();

const db = DatabaseManager.getInstance();

var sessionTokens = [];

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
        console.log(reservationId);

        // Add tables to reservation
        for (let i = 0; i < tablesNeeded; i++) {
            await db.AddTableToReservation(
                tables[i]._id,
                reservationId
            )
        }

        res.status(200);
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
            const sessionTokenData = {
                username: username,
                token: sessionToken,
                role: role
            }

            sessionTokens.push(sessionTokenData);

            res.cookie('sessionToken', sessionToken, { maxAge: 900000, httpOnly: true });
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

module.exports = router;
