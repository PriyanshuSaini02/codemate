const mongoose = require("mongoose");

const { Schema } = mongoose

const handRaiseSchema = new Schema({
    user : {type : mongoose.Schema.Types.ObjectId, ref : "User", required : true},
    raisedAt : {type: Date , default : Date.now}
});

handRaiseSchema.index({user : 1}, {unique : true});
// made so that one hand could be raised for one user

module.exports = mongoose.model("HandRaise", handRaiseSchema);