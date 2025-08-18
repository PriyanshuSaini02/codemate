const { userAuth } = require("../middleware/auth");
const { ValidateProfileEdit } = require("../utils/validation");
  const bcrypt = require("bcrypt");

const profileEdit = async (req, res) => {
  try {
    if (!ValidateProfileEdit(req)) {
      return res.status(400).json({ message: "Invalid Edit request" });
    }
    const loggedInUser = req.user; //req.user is saved in userAuth
    console.log("Updated successfully");

    Object.keys(req.body).forEach((key) => (loggedInUser[key] = req.body[key]));
    await loggedInUser.save();

    res.send(`${loggedInUser.name},your profile is updated`);
  } catch (err) {
    res.status(401).send("ERROR " + err.message);
  }
};

const profileGet = async (req, res) => {
  try {
    const user = req.user;
    // console.log(user);

    res.send(user);
  } catch (err) {
    res.status(400).send("Error saving the user:" + err.message);
  }
};

const profilePassChange = async (req, res) => {
  try {
    const user = req.user; // logged in user
    const { currentpassword, newpassword, confirmpassword } = req.body;

    // 1. Check current password
    const isMatch = await bcrypt.compare(currentpassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Your current password is wrong!" });
    }

    // 2. Check confirm password
    if (newpassword !== confirmpassword) {
      return res
        .status(400)
        .json({ message: "New password and confirm password do not match!" });
    }

    // 3. Prevent reusing the same password
    const isSameAsOld = await bcrypt.compare(newpassword, user.password);
    if (isSameAsOld) {
      return res
        .status(400)
        .json({ message: "New password cannot be same as old password!" });
    }

    // 4. Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newpassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { profileEdit, profileGet, profilePassChange };
