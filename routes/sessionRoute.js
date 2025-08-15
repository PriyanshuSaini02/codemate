const express = require('express');
const { userAuth } = require('../middleware/auth');
const {
    createSession,
    joinSession,
    getSession
} = require('../controllers/sessionController');

const router = express.Router();

router.post('/create', userAuth, createSession);
router.post('/join', userAuth, joinSession);
router.get('/:roomId', userAuth, getSession);

module.exports = router;
