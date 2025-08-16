const express = require('express');
const { userAuth } = require('../middleware/auth');
const {
    createSession,
    joinSession,
    getSession,
    shareSession,
    leaveSession
} = require('../controllers/sessionController');

const router = express.Router();

router.post('/create', userAuth, createSession);
router.post('/join/:roomId', userAuth, joinSession);
router.get('/:roomId', userAuth, getSession);
router.get('/share/:roomId', userAuth, shareSession);
router.post('/leave', userAuth, leaveSession);

module.exports = router;
