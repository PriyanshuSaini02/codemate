const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true
    },
    participants: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        leftAt: {
            type: Date,
            default: null
        }
    }],
    startedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date,
        default: null
    },
    duration: {
        type: Number, // in sec
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    callType: {
        type: String,
        enum: ['voice'],
        default: 'voice'
    }
}, {
    timestamps: true
});

// Calculate duration when call ends
callSchema.pre('save', function(next) {
    if (this.endTime && this.startTime && !this.duration) {
        this.duration = Math.floor((this.endTime - this.startTime) / 1000);
    }
    next();
});

module.exports = mongoose.model('Call', callSchema);