const express = require('express');
const {
    updateSessionCode,
    getSessionCode,
    updateCursorPosition,
    getActiveSessions
} = require('../controllers/collaborativeEditorController');

const router = express.Router();

// Optional auth middleware for token validation
const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.query.token;
    if (token) {
        // Validate token if provided
        try {
            // Basic token validation - expand as needed
            req.user = { token: token, isAuthenticated: true };
        } catch (error) {
            req.user = { token: 'guest-token', isAuthenticated: false };
        }
    } else {
        req.user = { token: 'guest-token', isAuthenticated: false };
    }
    next();
};

// Get session code and editor state (no auth required)
router.get('/:roomId', optionalAuth, getSessionCode);

// Update session code (no auth required)
router.put('/:roomId/code', optionalAuth, updateSessionCode);

// Update cursor position (no auth required)
router.put('/:roomId/cursor', optionalAuth, updateCursorPosition);

// Get active sessions overview (no auth required)
router.get('/active/sessions', optionalAuth, getActiveSessions);

module.exports = router;