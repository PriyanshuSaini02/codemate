const Session = require('../models/sessionModel');
const { v4: uuidv4 } = require('uuid');

const createSession = async (req, res) => {
    try {
        if (req.user.role !== 'ta') {
            return res.status(403).json({
                message: 'Only TAs are allowed to create a session'
            });
        }

        const { title, description, language, isPublic, tags } = req.body;
        const userId = req.user._id;
        const roomId = uuidv4();

        const session = new Session({
            roomId,
            title,
            description,
            creator: userId,
            participants: [userId],
            language: language || 'javascript',
            isPublic: isPublic !== undefined ? isPublic : true,
            tags: tags || [],
            codeHistory: [],
            activityLog: [{ user: userId, status: 'active' }] 
        });

        await session.save();

        const shareableLink = `${process.env.SHARABLE_URL || 'http://localhost:3000'}/join/${roomId}`;

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
        const userId = req.user._id;

        const session = await Session.findOne({ roomId });
        if (!session) return res.status(404).json({ message: 'Session not found' });

        if (!session.participants.includes(userId)) {
            session.participants.push(userId);
        }
        session.activityLog.push({ user: userId, status: 'active' });
        await session.save();

        const shareableLink = `${process.env.SHARABLE_URL || 'http://localhost:3000/api/session'}/join/${roomId}`;

        res.json({
            message: 'Joined session successfully',
            session,
            shareableLink
        });
    } catch (error) {
        res.status(500).json({ message: 'Error joining session', error: error.message });
    }
};

const leaveSession = async (req, res) => {
    try {
        const { roomId } = req.body;
        const userId = req.user._id;

        const session = await Session.findOne({ roomId });
        if (!session) return res.status(404).json({ message: 'Session not found' });

        session.participants = session.participants.filter(p => p.toString() !== userId.toString());

        session.activityLog.push({ user: userId, status: 'left' });

        await session.save();

        res.json({ message: 'Left session successfully', session });
    } catch (error) {
        res.status(500).json({ message: 'Error leaving session', error: error.message });
    }
};

const getSession = async (req, res) => {
    try {
        const session = await Session.findOne({ roomId: req.params.roomId })
            .populate('participants', 'name email')
            .populate('creator', 'name email')
            .populate('activityLog.user', 'name email');

        if (!session) return res.status(404).json({ message: 'Session not found' });

        const shareableLink = `${process.env.SHARABLE_URL || 'http://localhost:3000/api/session'}/join/${session.roomId}`;

        res.json({ ...session.toObject(), shareableLink });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching session', error: error.message });
    }
};
const shareSession = async (req, res) => {
    try {
        const { roomId } = req.params;

        const session = await Session.findOne({ roomId });
        if (!session) return res.status(404).json({ message: 'Session not found' });

        const shareableLink = `${process.env.SHARABLE_URL || 'http://localhost:3000/api/session'}/join/${session.roomId}`;

        res.json({
            message: 'Shareable link generated successfully',
            shareableLink
        });
    } catch (error) {
        res.status(500).json({ message: 'Error generating shareable link', error: error.message });
    }
};

module.exports = {
    createSession,
    joinSession,
    leaveSession,
    getSession,
    shareSession
};