const express = require("express");
const profileRouter = express.Router();
const bcrypt = require("bcrypt");
const { userAuth } = require("../middleware/auth");
const { ValidateProfileEdit } = require("../utils/validation.js");
const {
    profileEdit,
    profileGet,
    profilePassChange,
} = require("../controllers/profileController.js");

profileRouter.get("/profile/view", userAuth, profileGet);

profileRouter.patch("/profile/edit", userAuth, profileEdit);

profileRouter.patch("/profile/changePass", userAuth, profilePassChange);

module.exports = profileRouter;
