const { generateJWT } = require("../middlewares/jwt.middleware");
const passport = require("passport");
const User = require("../models/user");


const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || (password !== user.password)) {
      return res.status(400).json({ message: "Wrong credentials" });
    }

    const token = generateJWT({ id: user._id, name: user.name, email: user.email });
    res.cookie('jwt', token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "none" });

    res.status(200).json({ message: "User logged in successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
};

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const newUser = new User({ name, email, password });
    await newUser.save();

    const token = generateJWT({ id: newUser._id, email: newUser.email, name: newUser.name });

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: "none"
    });

    res.status(201).json({ message: "User created successfully!", token });
  } catch (error) {
    res.status(500).json({ message: "Error creating user", error });
  }
};

const logout = (req, res) => {
  res.clearCookie("jwt");
  res.json({ message: "Logged out successfully" });
};

module.exports = {
  login,
  signup,
  logout
};