const HandRaise = require("../models/handRaiseModel");

const raiseHand = async(req,res,next) => {
    try{
        const existing = await HandRaise.findOne({user: req.user._id});

        if(existing){
            return res.status(400).json({message : "Already hand raised"});
        }

        const hand = await HandRaise.create({user: req.user._id});
        res.status(200).json({message: "Hand Raised", hand});
    }catch(err){
        next(err);
    }
}

const lowerHand = async (req,res,next) => {
    try{
        const deletedHand = await HandRaise.findOneAndDelete({user : req.user._id});
        if(!deletedHand){
            return res.status(400).json({message : "Hand not raised"});
        }

        res.status(200).json({message : "Hand lowered"});
    }catch (err){
        next(err);
    }
}

module.exports = {raiseHand, lowerHand};