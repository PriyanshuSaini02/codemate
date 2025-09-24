const express = require('express');
const ExecuteFun = require("../controllers/executeCode");
const { userAuth } = require("../middleware/auth");
const router = express.Router();

router.post("/execute",ExecuteFun);

module.exports = router;