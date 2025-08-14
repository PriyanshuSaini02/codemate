const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const cookieparser = require("cookie-parser");

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Get single user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user" });
  }
};

// Register
const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      profilePicture,
      bio,
      skills,
      programmingLanguages,
      university,
      yearOfStudy,
      isActive,
      lastLogin,
      emailVerified,
    } = req.body;

    // Required fields check
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      profilePicture,
      bio,
      skills,
      programmingLanguages,
      university,
      yearOfStudy,
      isActive,
      lastLogin,
      emailVerified,
    });

    await user.save();

    // Send back all user data except password
    const { password: _, ...userData } = user.toObject();

    res.status(201).json({
      message: "User registered successfully",
      data: userData,
    });
  } catch (error) {
    console.error("Register user error:", error);
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
};

// Login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      //create JWT
      const token = await user.getJWT();
      //Add the token to the cookie and send the response
      res.cookie("token", token);
      res.send("Login successful");
      console.log("Logged In: " + user.firstName);
    } else {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    user.lastLogin = new Date();
    await user.save();

    res.json({
      message: "Login successful",
      user: { ...user.toObject(), password: undefined },
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in" });
  }
};

// Create new user (admin use)
const createUser = async (req, res) => {
  try {
    const hashedPassword = req.body.password
      ? await bcrypt.hash(req.body.password, 10)
      : undefined;
    const user = new User({ ...req.body, password: hashedPassword });
    await user.save();
    res.status(201).json({ ...user.toObject(), password: undefined });
  } catch (error) {
    res.status(500).json({ message: "Error creating user" });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error updating user" });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user" });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  registerUser,
  loginUser,
  createUser,
  updateUser,
  deleteUser,
};
