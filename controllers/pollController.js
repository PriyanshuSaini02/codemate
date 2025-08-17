const Poll = require('../models/pollModel');
const Session = require('../models/sessionModel');

const createPoll = async (req,res) => {
    try{
        if(req.user.role != "ta"){
            return res.status(403).json({message: 'Only TA can create polls'});
        }

        const {sessionId, question, options} = req.body;

        if(!question || !option || option.length < 2){
            return res.status(400).json({message: "Question and min 2 options required"});
        }

        const session = await Session.findById(sessionId);

        if(!session){
            return res.status(404).json({message : "Invalid Session"});
        }

        const poll = new Poll({
            session: sessionId,
            question,
            option: options.map(opt => ({text: opt})),
            createdBy: req.user._id
        });

        await poll.save();

        res.status(201).json({message: "Poll created", poll});
    }catch(err){
        res.status(500).json({message: "Some error occured", error: err.message});
    }
};

const votePoll = async (req,res) => {
    try{
        const { pollId, optionIdx} = req.body;

        const poll = await Poll.findById(pollId);

        if(!poll){
            return res.status(404).json({message: "Poll not found"});
        }

        if(!poll.isActive){
            return res.status(400).json({message: "Poll closed"});
        }

        if(optionIdx < 0 || optionIdx >= poll.option.length){
            return res.status(400).json({message: "Invalid option idx"});
        }

        poll.options[optionIdx].votes += 1;
        await poll.save();

        res.json({message: "Vote recorded", poll});
    }catch (err){
        res.status(500).json({message: "Some error occured", error: err.message});
    }
};

const getPolls = async (req,res) =>{
    try{
        const { sessionId } = req.params;
        const polls = await Poll.find({ssession : sessionId}).populate("createdBy", "name email");

        res.json({polls});
    }catch (err){
        res.status(500).json({message: 'Error occured',err});
    }
};

const closePoll = async (req,res) => {
    try{
        const {pollId} = req.params;

        const  poll = await Poll.findById(pollId);

        if(!poll){
            return res.status(404).json({message: "Poll not found"});
        }

        if(req.user.role != 'ta' || poll.createdBy.toString() !== req.user._id.toString()){
            return res.status(403).json({message: "Only TA can close the poll"});
        }

        poll.isActive = false;

        await poll.save();

        res.json({message: "Poll closed", poll});
    }catch(err){
        res.status(500).json({message: "Some error occured", err});
    }
};

module.exports = {createPoll,votePoll,getPolls,closePoll};