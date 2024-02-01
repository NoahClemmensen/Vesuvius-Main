var express = require('express');
const DatabaseManager = require("../DatabaseManager");
var router = express.Router();

const db = DatabaseManager.getInstance();

async function checkAvailableTables(time, guests) {
    try {
        const tables = await db.GetAvailableTables(time);
        const availableTables = tables.length;
        const tablesNeeded = Math.ceil(guests / 2);

        return tablesNeeded > availableTables
    } catch (e) {
        console.log(e);
        throw e;
    }
}

router.post('/getAvailableTables', async function(req, res, next) {
    try {
        const tables = await db.GetAvailableTables(req.body.selectedTime);
        console.log(tables)
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

module.exports = router;
