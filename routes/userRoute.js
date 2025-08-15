const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  logoutUser,
} = require("../controllers/userController");

router.get("/", (req, res) => {
  res.send("CodeMate Homepage");
});
// POST /api/auth/register
router.post("/register", registerUser);

// POST /api/auth/login
router.post("/login", loginUser);
router.post("/logout", logoutUser);

module.exports = router;
