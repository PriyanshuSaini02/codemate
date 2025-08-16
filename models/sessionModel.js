const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        default: ''
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    description: { 
        type: String,
        default: ''
    },
    creator: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    language: { 
        type: String,
        default: 'javascript'
    },
    codeHistory: [{ 
        code: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],
    isPublic: {
        type: Boolean,
        default: true
    },
    tags: [{ 
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
     activityLog: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        status: { type: String, enum: ['active', 'left'], required: true },
        timestamp: { type: Date, default: Date.now }
    }]
});

module.exports = mongoose.model('Session', sessionSchema);
