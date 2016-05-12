var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('radioPanel', { title: 'PTLS-Comm' });
});

module.exports = router;
