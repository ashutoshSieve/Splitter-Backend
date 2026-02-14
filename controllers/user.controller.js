const User = require("../models/user");
const DateFn = require("../utils/date.util");
const mongoose = require("mongoose");

const verifyToken = (req, res) => {
  res.status(200).json({ message: "Token is valid", user: req.payload });
};

const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.payload.id).populate("community", "name");
    if (!user) return res.status(404).json({ message: "User not found" });

    const value = DateFn();
    const communityNames = user.community.map(comm => comm.name);

    res.json({
      name: user.name,
      date: value,
      community: communityNames
    });

  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getExpenses = async (req, res) => {
  const date = DateFn();
  try {
    const user = await User.findById(req.payload.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const todayExpenses = user.expense.find(exp => exp.date === date);

    res.status(200).json(todayExpenses ? todayExpenses.items : []);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const userHistory = async (req, res) => {
  try {
    const user = await User.findById(req.payload.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ name: user.name, expense: user.expense });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addItems = async (req, res) => {
  const { details, amount } = req.body;
  const date = DateFn();

  try {
    const user = await User.findById(req.payload.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let dateEntry = user.expense.find(exp => exp.date === date);

    if (dateEntry) {
      dateEntry.items.push({ details, amount });
    } else {
      user.expense.push({ date, items: [{ details, amount }] });
    }

    await user.save();

    const latestExpense = user.expense.find(exp => exp.date === date).items.slice(-1)[0];

    res.status(200).json(latestExpense);
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteItem = async (req, res) => {
  try {
    const { id } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    const user = await User.findOneAndUpdate(
      { "expense.items._id": id },
      { $pull: { "expense.$.items": { _id: id } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const cleanedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { $pull: { expense: { items: { $eq: [] } } } },
      { new: true }
    );

    res.json({
      message: "Expense deleted successfully",
      user: cleanedUser
    });

  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  verifyToken,
  getUser,
  getExpenses,
  userHistory,
  addItems,
  deleteItem
};