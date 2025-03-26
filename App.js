require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { jsonwebtoken, generateJWT } = require("./JWTAUTH"); // Fixed import
const passport = require("passport");
const User = require("./User");
const mongoose = require("mongoose");
const Community = require("./Community");
const Date=require("./Date");

const app = express();


app.use(cors({
    origin: ["https://splitter-friend.netlify.app"],
    methods: ["GET", "POST", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(passport.initialize());
app.use(cookieParser());
require("./GAuth");

// 🔹 Google Authentication Routes
app.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
      const user = req.user;
      const token = generateJWT({ id: user._id, name: user.name, email: user.email });

      res.cookie("jwt", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "None",
          maxAge: 24 * 60 * 60 * 1000
      });

      res.redirect("https://splitter-friend.netlify.app/main");
  }
);

// 🔹 Verify JWT Token Route
app.get("/verify-token", jsonwebtoken, (req, res) => {
    res.status(200).json({ message: "Token is valid", user: req.payload });
});

// 🔹 Fetch User Data
app.get("/user", jsonwebtoken, async (req, res) => {
    try {
        // ✅ Populate community field
        const user = await User.findById(req.payload.id).populate("community", "name"); 

        if (!user) return res.status(404).json({ message: "User not found" });

        const value = Date(); 
        const communityNames = user.community.map(comm => comm.name); // ✅ Get all community names

        res.json({ 
            name: user.name, 
            date: value, 
            community: communityNames // ✅ Send an array of names
        });

    } catch (error) {
        console.error("Error fetching user info:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Expense fetch
app.get("/getExpenses", jsonwebtoken, async (req, res) => {
    const date=Date();

    try {
        const user = await User.findById(req.payload.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const todayExpenses = user.expense.find(exp => exp.date === date);

        res.status(200).json(todayExpenses ? todayExpenses.items : []);
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Transcation History
app.get("/userHistory", jsonwebtoken, async (req, res) => {
    try {
        const user = await User.findById(req.payload.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const totalExpenses = user.expense; // Get all expense data

        res.status(200).json({name: user.name, expense: user.expense });
    } catch (error) {
        console.error("Error fetching expenses:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// community creating
app.post("/createCommunity", jsonwebtoken, async (req, res) => {
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

        // ✅ Ensure the creator is added correctly with `userId`
        const newCommunity = new Community({
            name,
            peoples: [{ userId: user._id, amount: [] }] // ✅ Empty array since it's an array of objects
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
        console.error("❌ Error creating community:", error);
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});

// Enter the community
app.get("/community/:name", jsonwebtoken, async (req, res) => {
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

        // Check if the user is already in the community
        const isUserInCommunity = community.peoples.some(person =>
            person && person.userId && person.userId._id.toString() === user._id.toString()
        );

        if (!isUserInCommunity) {
            const newUserEntry = {
                userId: user._id,
                amount: community.peoples.map(person => ({
                    respected_userID: person.userId._id, // Existing users' IDs
                    give: 0,
                    take: 0
                }))
            };

            // Add the new user to the community
            community.peoples.push(newUserEntry);

            // Update existing members to include the new user in their amount array
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

            // Save the updated community
            await community.save();
        }

        // 🔹 Ensure User's Community List is Updated
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
            date: Date()
        });

    } catch (err) {
        console.error("❌ Error fetching community data:", err);
        res.status(500).json({ message: "Error fetching community data", error: err.message });
    }
});

// Add expense to community
app.post("/commAddExpense/:name", jsonwebtoken, async (req, res) => {
    try {
        const { amount, description, members } = req.body;

        if (!amount || !description || !members.length) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const community = await Community.findOne({ name: req.params.name });
        if (!community) return res.status(404).json({ message: "Community not found" });

        const totalMembers = members.length;
        const splitAmount = amount / totalMembers;

        // Find spender (the user who added the expense)
        const spender = community.peoples.find(m => m.userId.toString() === req.payload.id);
        if (!spender) return res.status(404).json({ message: "Spender not found in community" });

        // ✅ Update the spender's `take` for each selected member
        members.forEach(id => {
            let existingAmount = spender.amount.find(m => m.respected_userID.toString() === id);
            if (existingAmount) {
                existingAmount.take += splitAmount;
            }
        });

        // ✅ Update each member's `give` for the spender
        members.forEach(id => {
            if (id !== req.payload.id) { // Skip if it's the spender
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
            date:  Date(),
            records: [{
                userId: req.payload.id,
                desc: description,
                amount,
                users: members
            }]
        };
        community.expenses.push(newExpense);


        // Save the updated community
        await community.save();

        res.json({ message: "Expense added successfully" });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// Delete an expense in a community 
app.delete("/commDeleteExpense/:name", jsonwebtoken, async (req, res) => {
    try {
        const { id, members } = req.body; // Receiving expense ID and involved members
        const userId = req.payload.id;

        if (!id || !members || !members.length) {
            return res.status(400).json({ message: "Expense ID and members are required" });
        }

        const community = await Community.findOne({ name: req.params.name });
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }

        let expenseDeleted = false;
        let deletedAmount = 0;

        // ✅ Find and delete the expense
        for (const expense of community.expenses) {
            const recordIndex = expense.records.findIndex(record => record._id.toString() === id);

            if (recordIndex !== -1) {
                const record = expense.records[recordIndex];

                // ✅ Ensure only the creator can delete it
                if (record.userId.toString() !== userId) {
                    return res.status(403).json({ message: "Forbidden: You can only delete your own expenses" });
                }

                // ✅ Remove the record
                expense.records.splice(recordIndex, 1);
                expenseDeleted = true;
                deletedAmount = record.amount;
                break; // Exit loop once found
            }
        }

        if (!expenseDeleted) {
            return res.status(404).json({ message: "Expense record not found or unauthorized to delete" });
        }

        // ✅ Calculate per-person split amount
        const splitAmount = deletedAmount / members.length;

        // ✅ Update the spender's `take` for each selected member
        const spender = community.peoples.find(m => m.userId.toString() === userId);
        if (spender) {
            members.forEach(id => {
                let existingAmount = spender.amount.find(m => m.respected_userID.toString() === id);
                if (existingAmount) {
                    existingAmount.take -= splitAmount; // Reduce `take`
                }
            });
        }

        // ✅ Update each member's `give` for the spender
        members.forEach(id => {
            if (id !== userId) { // Skip if it's the spender
                const member = community.peoples.find(m => m.userId.toString() === id);
                if (member) {
                    let existingAmount = member.amount.find(m => m.respected_userID.toString() === userId);
                    if (existingAmount) {
                        existingAmount.give -= splitAmount; // Reduce `give`
                    }
                }
            }
        });

        // ✅ Save the updated community document
        await community.save();

        res.status(200).json({ message: "Expense deleted successfully, and balances updated" });

    } catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


// Get today's expenses
app.get("/todayExpense/:name", jsonwebtoken, async (req, res) => {
    try {
        const community = await Community.findOne({ name: req.params.name });
        if (!community) return res.status(404).json({ message: "Community not found" });
        
        const todayDate = Date();
        const todayExpenses = community.expenses.filter(expense => expense.date === todayDate);
        
        res.status(200).json({ expenses: todayExpenses });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

app.get("/commHistory/:name", jsonwebtoken, async (req,res) =>{
    try {
        const community = await Community.findOne({ name: req.params.name });
        if (!community) return res.status(404).json({ message: "Community not found" });
        res.status(200).json({ expenses: community.expenses });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

app.get("/readInDetails/:name/:ID", async (req, res) => {
    const { name, ID } = req.params;

    try {
        const expenseId = new mongoose.Types.ObjectId(ID);

        // Find the community by name
        const community = await Community.findOne({ name });

        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }

        // Find the expense with the given ID inside the expenses array
        const expense = community.expenses.find(exp => exp._id.equals(expenseId));

        if (!expense) {
            return res.status(404).json({ message: "Expense record not found" });
        }

        // Fetch user details for the `userId` field and users array
        const recordsWithUserNames = await Promise.all(
            expense.records.map(async (record) => {
                const adder = await User.findById(record.userId).select("name"); // Fetch the name of adder
                const usersDetails = await User.find({ _id: { $in: record.users } }).select("name"); // Fetch names of users involved

                return {
                    ...record.toObject(),
                    addedBy: adder ? adder.name : "Unknown User", // Replace userId with name
                    users: usersDetails.map(user => user.name), // Replace user IDs with names
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
});



// Logout
app.post("/logout", (req, res) => {
    res.clearCookie("jwt"); // Remove JWT cookie if used
    res.json({ message: "Logged out successfully" });
});
  
// 🔹 User Login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || (password!==user.password)) {
          return res.status(400).json({ message: "Wrong credentials" });
        }

        const token = generateJWT({ id: user._id, name: user.name, email: user.email });
        res.cookie('jwt', token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "None" });

        res.status(200).json({ message: "User logged in successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Error logging in", error });
    }
});

// 🔹 User Signup (with Hashed Password)
app.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });

        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const newUser = new User({ name, email, password });
        await newUser.save();

        const token = generateJWT({ id: newUser._id, email: newUser.email, name: newUser.name});

        // Set cookie correctly
        res.cookie("jwt", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production" ? true : false, // Secure only in production
            sameSite: "None"
        });
        

        res.status(201).json({ message: "User created successfully!", token });
    } catch (error) {
        res.status(500).json({ message: "Error creating user", error });
    }
});

// Add Items in User Schema
app.post("/addItems", jsonwebtoken, async (req, res) => {
    const { details, amount } = req.body;
    const date = Date();

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
});

// User Transction History Delete
app.delete("/deleteItem", jsonwebtoken, async (req, res) => {
    try {
        const { id } = req.body;  
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid expense ID" });
        }

        const updatedUser = await User.findOneAndUpdate(
            { "expense.items._id": id }, 
            { $pull: { "expense.$.items": { _id: id } } },  // Remove matching item
            { new: true } // Return updated user
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "Expense not found" });
        }

        res.json({ message: "Expense deleted successfully", user: updatedUser });
    } catch (error) {
        console.error("Error deleting expense:", error);
        res.status(500).json({ message: "Server error", error });
    }
});


//  Server Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
