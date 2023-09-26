var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/lobby', function (req, res, next) {
  res.render('lobby', { title: 'Lobby' });
})

router.get('/text_chat', function (req, res, next) {
  res.render('text_chat', { title: 'Text Chat' });
})

router.get('/video_chat', function (req, res, next) {
  res.render('video_chat', { title: 'Video Chat' });
})
module.exports = router;
