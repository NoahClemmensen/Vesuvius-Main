var express = require('express');
const DatabaseManager = require("../DatabaseManager");
var router = express.Router();

const db = DatabaseManager.getInstance();

router.get('/getAvailableTables', function(req, res, next) {

});

module.exports = router;
