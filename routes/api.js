var express = require('express');
const DatabaseManager = require("../DatabaseManager");
var router = express.Router();

const db = DatabaseManager.getInstance();

router.post('/getAvailableTables', function(req, res, next) {
    console.log(req.body);
    new Date()
    db.GetAvailableTables(new Date(req.body.selectedTime))
        .then((tables) => {
            res.json(tables.recordset);
            res.status(200);
        })
        .catch((err) => {
            res.send(err);
            res.status(500);
        });

});

module.exports = router;
