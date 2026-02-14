const Community = require("../models/community");
const User = require("../models/user");
const mongoose = require("mongoose");
const DateFn = require("../utils/date.util");

const createCommunity = async (req, res) => {
  try {
    if (!req.payload) {
      return res.status(401).json({ message: "Unauthorized: No user found in token" });
    }

    const user = await User.findById(req.payload.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Community name is required" });
    }

    const existingCommunity = await Community.findOne({ name });
    if (existingCommunity) {
      return res.status(400).json({ message: "Community already exists!" });
    }

    const newCommunity = new Community({
      name,
      peoples: [{ userId: user._id, amount: [] }]
    });

    await newCommunity.save();
    await User.findByIdAndUpdate(user._id, {
      $addToSet: { community: newCommunity._id }
    });

    res.status(201).json({
      message: "Community created successfully!",
      community: newCommunity
    });

  } catch (error) {
    console.error(" Error creating community:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

const getCommunity = async (req, res) => {
  try {
    if (!req.payload) {
      return res.status(401).json({ message: "Unauthorized: User not found in token" });
    }
    const storeID = req.payload.id;
    const user = await User.findById(req.payload.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let community = await Community.findOne({ name: req.params.name })
      .populate("peoples.userId", "name _id");

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const isUserInCommunity = community.peoples.some(person =>
      person && person.userId && person.userId._id.toString() === user._id.toString()
    );

    if (!isUserInCommunity) {
      const newUserEntry = {
        userId: user._id,
        amount: community.peoples.map(person => ({
          respected_userID: person.userId._id,
          give: 0,
          take: 0
        }))
      };

      community.peoples.push(newUserEntry);

      community.peoples.forEach(member => {
        if (member.userId.toString() !== user._id.toString()) {
          const alreadyExists = member.amount.some(a => a.respected_userID.toString() === user._id.toString());
          if (!alreadyExists) {
            member.amount.push({
              respected_userID: user._id,
              give: 0,
              take: 0
            });
          }
        }
      });

      await community.save();
    }

    await User.findByIdAndUpdate(user._id, {
      $addToSet: { community: community._id }
    });

    res.json({
      loginUser: storeID,
      name: community.name,
      members: community.peoples.map(person => ({
        id: person.userId._id.toString(),
        name: person.userId.name || "Unknown",
        amounts: person.amount.map(a => ({
          respected_userID: a.respected_userID.toString(),
          give: a.give,
          take: a.take
        }))
      })),
      expenses: community.expenses || [],
      date: DateFn()
    });

  } catch (err) {
    console.error(" Error fetching community data:", err);
    res.status(500).json({ message: "Error fetching community data", error: err.message });
  }
};

const commAddExpense = async (req, res) => {
  try {
    const { amount, description, members } = req.body;

    if (!amount || !description || !members.length) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const community = await Community.findOne({ name: req.params.name });
    if (!community) return res.status(404).json({ message: "Community not found" });

    const totalMembers = members.length;
    const splitAmount = amount / totalMembers;

    const spender = community.peoples.find(m => m.userId.toString() === req.payload.id);
    if (!spender) return res.status(404).json({ message: "Spender not found in community" });

    members.forEach(id => {
      let existingAmount = spender.amount.find(m => m.respected_userID.toString() === id);
      if (existingAmount) {
        existingAmount.take += splitAmount;
      }
    });

    members.forEach(id => {
      if (id !== req.payload.id) {
        const member = community.peoples.find(m => m.userId.toString() === id);
        if (member) {
          let existingAmount = member.amount.find(m => m.respected_userID.toString() === req.payload.id);
          if (existingAmount) {
            existingAmount.give += splitAmount;
          }
        }
      }
    });

    const newExpense = {
      date: DateFn(),
      records: [{
        userId: req.payload.id,
        desc: description,
        amount,
        users: members
      }]
    };
    community.expenses.push(newExpense);

    await community.save();

    res.json({ message: "Expense added successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const commDelete = async (req, res) => {
  try {
    const { id } = req.body;
    const userId = req.payload.id;

    if (!id) {
      return res.status(400).json({ message: "Expense ID is required" });
    }

    const community = await Community.findOne({ name: req.params.name });
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    let expenseDeleted = false;
    let deletedAmount = 0;
    let members = [];

    for (const expense of community.expenses) {
      const recordIndex = expense.records.findIndex(record => record._id.toString() === id);

      if (recordIndex !== -1) {
        const record = expense.records[recordIndex];

        if (record.userId.toString() !== userId) {
          return res.status(403).json({ message: "Forbidden: You can only delete your own expenses" });
        }

        members = record.users;
        deletedAmount = record.amount;

        
        expense.records.splice(recordIndex, 1);
        if (expense.records.length === 0) {
          const expenseIndex = community.expenses.indexOf(expense);
          community.expenses.splice(expenseIndex, 1);
        }
        expenseDeleted = true;
        break;
      }
    }

    if (!expenseDeleted) {
      return res.status(404).json({ message: "Expense record not found or unauthorized to delete" });
    }

    if (!members || members.length === 0) {
      return res.status(400).json({ message: "Expense does not have valid members" });
    }

    const splitAmount = deletedAmount / members.length;

    const spender = community.peoples.find(m => m.userId.toString() === userId);
    if (spender) {
      members.forEach(memberId => {
        let existingAmount = spender.amount.find(m => m.respected_userID.toString() === memberId);
        if (existingAmount) {
          existingAmount.take -= splitAmount;
        }
      });
    }

    members.forEach(memberId => {
      if (memberId !== userId) {
        const member = community.peoples.find(m => m.userId.toString() === memberId);
        if (member) {
          let existingAmount = member.amount.find(m => m.respected_userID.toString() === userId);
          if (existingAmount) {
            existingAmount.give -= splitAmount;
          }
        }
      }
    });

    await community.save();

    res.status(200).json({ message: "Expense deleted successfully, and balances updated" });

  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const todayExpense = async (req, res) => {
  try {
    const community = await Community.findOne({ name: req.params.name });
    if (!community) return res.status(404).json({ message: "Community not found" });

    const todayDate = DateFn();
    const todayExpenses = community.expenses.filter(expense => expense.date === todayDate);

    res.status(200).json({ expenses: todayExpenses });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const commHistory = async (req, res) => {
  try {
    const community = await Community.findOne({ name: req.params.name });
    if (!community) return res.status(404).json({ message: "Community not found" });
    res.status(200).json({ expenses: community.expenses });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const readInDetails = async (req, res) => {
  const { name, ID } = req.params;

  try {
    const expenseId = new mongoose.Types.ObjectId(ID);

    const community = await Community.findOne({ name });

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const expense = community.expenses.find(exp => exp._id.equals(expenseId));

    if (!expense) {
      return res.status(404).json({ message: "Expense record not found" });
    }

    const recordsWithUserNames = await Promise.all(
      expense.records.map(async (record) => {
        const adder = await User.findById(record.userId).select("name");
        const usersDetails = await User.find({ _id: { $in: record.users } }).select("name");

        return {
          ...record.toObject(),
          addedBy: adder ? adder.name : "Unknown User",
          users: usersDetails.map(user => user.name),
        };
      })
    );

    return res.json({
      ...expense.toObject(),
      records: recordsWithUserNames,
    });

  } catch (error) {
    console.error("Error fetching expense details:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createCommunity,
  getCommunity,
  commAddExpense,
  commDelete,
  todayExpense,
  commHistory,
  readInDetails
};