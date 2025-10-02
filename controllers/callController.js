const Call = require('../models/callModel');
const Session = require('../models/sessionModel');

const startCall = async (req, res) => {
    try {
        const { roomId } = req.body;
        const userId = req.user._id;

        const session = await Session.findOne({ roomId });
        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        if (!session.participants.includes(userId)) {
            return res.status(403).json({ message: 'You are not a participant in this session' });
        }

        const existingCall = await Call.findOne({ roomId, isActive: true });
        if (existingCall) {
            return res.status(400).json({ message: 'Call already in progress' });
        }

        const call = new Call({
            roomId,
            startedBy: userId,
            participants: [{
                userId: userId,
                joinedAt: new Date()
            }]
        });

        await call.save();

        res.status(201).json({
            message: 'Call started successfully',
            call: {
                _id: call._id,
                roomId: call.roomId,
                startTime: call.startTime,
                startedBy: userId
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error starting call', error: error.message });
    }
};

const joinCall = async (req, res) => {
    try {
        const { roomId } = req.body;
        const userId = req.user._id;

        const call = await Call.findOne({ roomId, isActive: true });
        if (!call) {
            return res.status(404).json({ message: 'No active call found' });
        }

        const existingParticipant = call.participants.find(p => p.userId.toString() === userId.toString());
        if (existingParticipant) {
            return res.status(400).json({ message: 'You are already in the call' });
        }

        call.participants.push({
            userId: userId,
            joinedAt: new Date()
        });

        await call.save();

        res.json({
            message: 'Joined call successfully',
            call: {
                _id: call._id,
                roomId: call.roomId,
                startTime: call.startTime,
                participantCount: call.participants.length
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error joining call', error: error.message });
    }
};

const leaveCall = async (req, res) => {
    try {
        const { roomId } = req.body;
        const userId = req.user._id;

        const call = await Call.findOne({ roomId, isActive: true });
        if (!call) {
            return res.status(404).json({ message: 'No active call found' });
        }

        const participant = call.participants.find(p => p.userId.toString() === userId.toString());
        if (!participant) {
            return res.status(400).json({ message: 'You are not in the call' });
        }

        participant.leftAt = new Date();

        const activeParticipants = call.participants.filter(p => !p.leftAt);
        if (activeParticipants.length === 0) {
            call.isActive = false;
            call.endTime = new Date();
        }

        await call.save();

        res.json({
            message: 'Left call successfully',
            callEnded: !call.isActive,
            duration: call.duration
        });
    } catch (error) {
        res.status(500).json({ message: 'Error leaving call', error: error.message });
    }
};

const endCall = async (req, res) => {
    try {
        const { roomId } = req.body;
        const userId = req.user._id;

        const call = await Call.findOne({ roomId, isActive: true });
        if (!call) {
            return res.status(404).json({ message: 'No active call found' });
        }

        if (call.startedBy.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Only the call starter can end the call' });
        }

        call.isActive = false;
        call.endTime = new Date();

        call.participants.forEach(participant => {
            if (!participant.leftAt) {
                participant.leftAt = new Date();
            }
        });

        await call.save();

        res.json({
            message: 'Call ended successfully',
            duration: call.duration,
            totalParticipants: call.participants.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Error ending call', error: error.message });
    }
};



module.exports = {
    startCall,
    joinCall,
    leaveCall,
    endCall
};