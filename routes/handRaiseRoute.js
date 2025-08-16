const express = require("express");
const {userauth, userAuth} = require("../middleware/auth");
const {raiseHand, lowerHand} = require("../controllers/handRaiseController");
const router = express.Router();

router.post("/raise",userAuth,raiseHand);
router.post("/lower",userAuth,lowerHand);


module.exports = router;