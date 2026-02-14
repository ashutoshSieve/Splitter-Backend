const mongoose = require("mongoose");

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

const User = mongoose.model("User", UserSchema);
module.exports = User;