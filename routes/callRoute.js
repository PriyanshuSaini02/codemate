const express = require('express');
const { userAuth } = require('../middleware/auth');
const {
    startCall,
    joinCall,
    leaveCall,
    endCall,
} = require('../controllers/callController');

const router = express.Router();

router.post('/start', userAuth, startCall);

router.post('/join', userAuth, joinCall);

router.post('/leave', userAuth, leaveCall);

// End(only starter can do)
router.post('/end', userAuth, endCall);


module.exports = router;