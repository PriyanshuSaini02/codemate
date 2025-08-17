const mongoose = require("mongoose");

const {Schema} = mongoose;

const optionSchema = new Schema({
    text : {type: String, required: true},
    votes: {type: Number, default: 0}
});

const  pollSchema = new Schema({
    session: {type: Schema.Types.ObjectId, ref: 'Session', required: true},
    questions: {type: String, required: true},
    options: [optionSchema],
    createdBy: {type: Schema.Types.ObjectId, ref: "User", required: true},
    isActive: {type: Boolean, default: true}
});

module.exports = mongoose.model("Poll", pollSchema);