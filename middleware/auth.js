const jwt = require("jsonwebtoken");
const User = require("../models/userModel.js");
const cookieparser = require("cookie-parser");


const userAuth = async (req, res, next) => {
  try {
    // Read the token from the cookies
    const { token } = req.cookies;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    // Validate the token
    const decodeObj = jwt.verify(token, process.env.SECRET_KEY);

    if (!decodeObj || !decodeObj._id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token: Unable to extract user information"
      });
    }

    const { _id } = decodeObj;

    // Find the user
    const user = await User.findById(_id).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token: User not found"
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Authentication error:', err);

    // Handle specific JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token: Unable to extract user information"
      });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

module.exports = { userAuth };
