const express = require("express");
const router = express.Router();
const { jsonwebtoken } = require("../middlewares/jwt.middleware");
const {
  verifyToken,
  getUser,
  getExpenses,
  userHistory,
  addItems,
  deleteItem
} = require("../controllers/user.controller");

router.get("/verify-token", jsonwebtoken, verifyToken);
router.get("/user", jsonwebtoken, getUser);
router.get("/getExpenses", jsonwebtoken, getExpenses);
router.get("/userHistory", jsonwebtoken, userHistory);
router.post("/addItems", jsonwebtoken, addItems);
router.delete("/deleteItem", jsonwebtoken, deleteItem);

module.exports = router;