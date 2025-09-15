const HandRaise = require("../models/handRaiseModel");

const raiseHand = async(req,res,next) => {
    try{
        const existing = await HandRaise.findOne({user: req.user._id});

        if(existing){
            return res.status(400).json({message : "Already hand raised"});
        }

        const hand = await HandRaise.create({user: req.user._id});
        await hand.populate("user","name")

        res.status(200).json({message: `Hand Raised ${hand.user.name}`, hand});
    }catch(err){
        next(err);
    }
}

const lowerHand = async (req,res,next) => {
    try{
        const deletedHand = await HandRaise.findOneAndDelete({user : req.user._id});
        await deletedHand.populate("user" , "name")
        if(!deletedHand){
            return res.status(400).json({
                message : 'Hand not raised'
            });
        }
    
        res.status(200).json({message : `Hand lowered ${deletedHand.user.name}`});
    }catch (err){
        next(err);
    }
}

module.exports = {raiseHand, lowerHand};