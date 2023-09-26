'use strict';
var express = require('express');
var router = express.Router();
const webRtcController = require('../controllers/webRtcController');

// router.get('/test', (req, res) => {
//     res.send('respond with a resource');
// });
router.post('/createUser', webRtcController.createUser);
router.put('/leavingUser/:webRtcId', webRtcController.leavingUser);
router.put('/updateNewUser/:webRtcId', webRtcController.updateNewUser);
router.post('/getRemoteUsers', webRtcController.getRemoteUsers);
router.put('/updateOnOtherUserClosing/:webRtcId', webRtcController.updateOnOtherUserClosing);
router.put('/updateOnEnagament/:webRtcId', webRtcController.updateOnEnagament);
router.put('/updateOnNext/:webRtcId', webRtcController.updateOnNext);
router.post('/getNextUser', webRtcController.getNextUser);
module.exports = router;