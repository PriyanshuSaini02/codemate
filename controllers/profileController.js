const { userAuth } = require("../middleware/auth");
const { ValidateProfileEdit } = require("../utils/validation");

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
    console.log(user);

    res.send(user);
  } catch (err) {
    res.status(400).send("Error saving the user:" + err.message);
  }
};

const profilePassChange = async (req, res) => {
  const user = req.user;
  try {
    const { currentpassword, newpassword, confirmpassword } = req.body;
    const iscurrentPassword = await user.validatePassword(currentpassword);
    if (!iscurrentPassword) {
     return res.status(400).json({ message: "Your password is wrong" });
    }
    //now set user passord as new password and confirm it
    if (newpassword !== confirmpassword) {
      return res
        .status(400)
        .json({
          message:
            "Your password New password and confirm password do not match! wrong",
        });
    } else if (newpassword == currentpassword) {
      res.json({ message: "New password and current password are same!" });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newpassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports = { profileEdit, profileGet, profilePassChange };
