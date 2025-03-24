require("dotenv").config();
const Community=require("./Community");
const mongoose=require("mongoose");

mongoose.connect(process.env.URL)
  .then(() => console.log("Connected to MongoDB successfully"))
  .catch((error) => console.error("MongoDB connection error:", error));


const UserSchema = mongoose.Schema({
    name: String,
    email: String,
    password: String,
    google_id: String,
    community: [{ type: mongoose.Schema.Types.ObjectId, ref: "Community" }], 
    expense: [
        {
            date: String,
            items: [
                {
                    details: String,
                    amount: String
                }
            ]
        }
    ]
});


const User=mongoose.model("User",UserSchema);
module.exports=User;