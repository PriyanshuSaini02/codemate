const Session = require('../models/sessionModel');
const { v4: uuidv4 } = require('uuid');

// Store active editor sessions in memory (in production, use Redis)
const activeEditorSessions = new Map();

const updateSessionCode = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { code, language, cursorPosition, selection } = req.body;

        // Ensure user is authenticated
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userId = req.user._id;

        const session = await Session.findOne({ roomId });
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Check if user is a participant
        if (!session.participants.includes(userId)) {
            return res.status(403).json({ message: 'You are not a participant in this session' });
        }

        // Update session with new code
        session.currentCode = code;
        session.language = language || session.language;
        session.lastModified = new Date();
        session.lastModifiedBy = userId;

        // Add to code history
        session.codeHistory.push({
            code: code,
            timestamp: new Date(),
            author: userId,
            language: language || session.language
        });

        await session.save();

        // Update in-memory active session
        activeEditorSessions.set(roomId, {
            code,
            language: language || session.language,
            lastModified: new Date(),
            participants: session.participants,
            cursors: activeEditorSessions.get(roomId)?.cursors || new Map()
        });

        res.json({
            message: 'Code updated successfully',
            session: {
                roomId: session.roomId,
                code: session.currentCode,
                language: session.language,
                lastModified: session.lastModified
            },
            user: {
                name: req.user.name,
                email: req.user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating code', error: error.message });
    }
};

const getSessionCode = async (req, res) => {
    try {
        const { roomId } = req.params;

        // Ensure user is authenticated
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userId = req.user._id;

        const session = await Session.findOne({ roomId })
            .populate('participants', 'name email')
            .populate('lastModifiedBy', 'name email');

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        // Check if user is a participant
        if (!session.participants.some(p => p._id.toString() === userId.toString())) {
            return res.status(403).json({ message: 'You are not a participant in this session' });
        }

        // Get active session data
        const activeSession = activeEditorSessions.get(roomId);

        res.json({
            session: {
                roomId: session.roomId,
                title: session.title,
                code: session.currentCode || '',
                language: session.language,
                participants: session.participants,
                lastModified: session.lastModified,
                lastModifiedBy: session.lastModifiedBy,
                activeCursors: activeSession ? Array.from(activeSession.cursors.values()) : []
            },
            currentUser: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching session code', error: error.message });
    }
};

const updateCursorPosition = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { cursorPosition, selection } = req.body;

        // Ensure user is authenticated
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userId = req.user._id;

        const session = await Session.findOne({ roomId });
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (!session.participants.includes(userId)) {
            return res.status(403).json({ message: 'You are not a participant in this session' });
        }

        // Update cursor position in active session
        let activeSession = activeEditorSessions.get(roomId);
        if (!activeSession) {
            activeSession = {
                code: session.currentCode || '',
                language: session.language,
                participants: session.participants,
                cursors: new Map()
            };
            activeEditorSessions.set(roomId, activeSession);
        }

        activeSession.cursors.set(userId.toString(), {
            userId: userId.toString(),
            userName: req.user.name,
            cursorPosition,
            selection,
            timestamp: new Date()
        });

        res.json({
            message: 'Cursor position updated',
            user: {
                name: req.user.name,
                email: req.user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error updating cursor position', error: error.message });
    }
};

const getActiveSessions = (req, res) => {
    try {
        // Ensure user is authenticated
        if (!req.user || !req.user._id) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const activeSessions = Array.from(activeEditorSessions.entries()).map(([roomId, data]) => ({
            roomId,
            participantCount: data.participants.length,
            language: data.language,
            lastModified: data.lastModified,
            activeCursors: data.cursors.size
        }));

        res.json({
            activeSessions,
            requestedBy: {
                name: req.user.name,
                email: req.user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching active sessions', error: error.message });
    }
};

module.exports = {
    updateSessionCode,
    getSessionCode,
    updateCursorPosition,
    getActiveSessions,
    activeEditorSessions
};