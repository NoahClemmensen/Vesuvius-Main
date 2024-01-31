var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Vesuvius' });
});

router.get('/reservate', function(req, res, next) {
  res.render('reservate', { title: 'Vesuvius' });
});

module.exports = router;
