const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const cookieparser = require("cookie-parser");


const userAuth = async (req, res, next) => {
  //Read the token from the cookies
  try {
    const { token } = req.cookies;
    if (!token) {
      return res.status(401).json({ message: "Token is not valid" });
    }
    //validate the token
    const decodeObj = await jwt.verify(token, "redmi@6225");
    const { _id } = decodeObj;
    // console.log(_id);

    //find the user
    const user = await User.findById(_id).select("+password");

    if (!user) {
     return res.status(400).json({ message: "User Not Found" });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(400).send("Error:" + err.message);
  }
};

module.exports = { userAuth };
