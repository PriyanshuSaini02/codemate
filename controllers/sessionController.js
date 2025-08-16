const Session = require('../models/sessionModel');
const { v4: uuidv4 } = require('uuid');

const createSession = async (req, res) => {
    try {
        if (req.user.role !== 'ta') {
            return res.status(403).json({
                message: 'Only TAs are allowed to create a session'
            });
        }

        const {
            title,
            description,
            language,
            isPublic,
            tags
        } = req.body;

        const userId = req.user._id;
        const roomId = uuidv4(); // unique ID

        const session = new Session({
            roomId,
            title,
            description,
            creator: userId,
            participants: [userId],
            language: language || 'javascript',
            isPublic: isPublic !== undefined ? isPublic : true,
            tags: tags || [],
            codeHistory: []
        });

        await session.save();

        const shareableLink = `${process.env.FRONTEND_URL || 'http://localhost:3000/api/session'}/join/${roomId}`;

        res.status(201).json({
            message: 'Session created successfully',
            session,
            shareableLink
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating session', error: error.message });
    }
};

const joinSession = async (req, res) => {
    try {
        const roomId  = req.params.roomId;
        // console.log(roomId);
        
        const userId = req.user._id; // from JWT

        const session = await Session.findOne({ roomId });
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (!session.participants.includes(userId)) {
            session.participants.push(userId);
        }
        await session.save();

        const shareableLink = `${process.env.FRONTEND_URL || 'http://localhost:3000/api/session'}/join/${roomId}`;

        res.json({
            message: 'Joined session successfully',
            session,
            shareableLink
        });
    } catch (error) {
        res.status(500).json({ message: 'Error joining session', error: error.message });
    }
};


const getSession = async (req, res) => {
    try {
        const session = await Session.findOne({ roomId: req.params.roomId })
            .populate('participants', 'name email')
            .populate('creator', 'name email');

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const shareableLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join/${session.roomId}`;

        res.json({
            ...session.toObject(),
            shareableLink
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching session', error: error.message });
    }
};

module.exports = {
    createSession,
    joinSession,
    getSession
};