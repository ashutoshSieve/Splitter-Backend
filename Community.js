require("dotenv").config();
const User = require("./User");
const mongoose = require("mongoose");

mongoose.connect(process.env.URL)
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch((error) => console.error("MongoDB connection error:", error));


const CommunitySchema = new mongoose.Schema({
    name: String,
    peoples: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            amount: {
                give: { type: Number, default: 0 },  // ✅ Default to 0
                take: { type: Number, default: 0 }   // ✅ Default to 0
            }
        }
    ],
    expenses: [
        {
            date: String, 
            records: [
                new mongoose.Schema(
                    {
                        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                        desc: String,
                        amount: Number, // ✅ Changed from String to Number
                        users: []
                    },
                    { _id: true } // ✅ Ensures each record has a unique `_id`
                )
            ]
        }
    ]
});
  

const Community = mongoose.model("Community", CommunitySchema);
module.exports = Community;
