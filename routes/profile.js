const express = require("express");
const profileRouter = express.Router();
const bcrypt = require("bcrypt");
const { userAuth } = require("../middleware/auth");
const { ValidateProfileEdit } = require("../utils/validation.js");

profileRouter.get("/profile/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status(400).send("Error saving the user:" + err.message);
  }
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
  try {
    // if (!ValidateProfileEdit(req)) {
    //   return res.status(400).json({ message: "Invalid Edit request" });
    // }
    const loggedInUser = req.user; //req.user is saved in userAuth
    console.log("Updated successfully");
    

    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));
    await loggedInUser.save();

    res.send(`${loggedInUser.name},your profile is updated`);
  } catch (err) {
    res.status(401).send("ERROR ok " + err.message);
  }
});

module.exports = profileRouter;
