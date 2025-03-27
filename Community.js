require("dotenv").config();
const User = require("./User");
const mongoose = require("mongoose");

mongoose.connect(process.env.URL)
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch((error) => console.error("MongoDB connection error:", error));


const AmountSchema = new mongoose.Schema({
    give: { type: Number, default: 0 },  
    take: { type: Number, default: 0 },   
    respected_userID: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const CommunitySchema = new mongoose.Schema({
    name: String,
    peoples: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            amount: [AmountSchema]
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
                        amount: Number, 
                        users: []
                    },
                    { _id: true } 
                )
            ]
        }
    ]
});
  

const Community = mongoose.model("Community", CommunitySchema);
module.exports = Community;
